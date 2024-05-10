// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    AuthPlugin,
    AuthPluginEvents,
    AuthState,
    LoginBehavior
} from "@open-pioneer/authentication";
import { EventEmitter, createLogger } from "@open-pioneer/core";
import { Service, ServiceOptions, type DECLARE_SERVICE_INTERFACE } from "@open-pioneer/runtime";
import Keycloak, {
    type KeycloakConfig,
    type KeycloakInitOptions,
    type KeycloakLoginOptions,
    type KeycloakLogoutOptions
} from "keycloak-js";
import { RefreshOptions } from "./api";

const LOG = createLogger("authentication-keycloak:KeycloakAuthPlugin");

/**
 * The central configuration properties of the plugin.
 *
 * These properties are required by the Keycloak JavaScript adapter.
 */
export interface KeycloakProperties {
    keycloakOptions: KeycloakOptions;
}

export interface KeycloakOptions {
    /**
     * Control the automatic refreshing of authentication tokens.
     * 'autoRefresh': Whether token refreshing should happen automatically.
     * 'interval': The interval (in milliseconds) at which token refreshing should occur.
     * 'timeLeft': The remaining time (in milliseconds) before token expiration.
     */
    refreshOptions: RefreshOptions;
    /**
     * Define how Keycloak initializes.
     * This properties can be used:
     * 'onLoad': Specifies when Keycloak should initialize.
     * 'pkceMethod': The method used for PKCE for enhanced security.
     * 'scope': The scope of the authentication.
     *
     */
    keycloakInitOptions: Partial<KeycloakInitOptions>;
    /**
     * The configuration details for connecting to Keycloak.
     * 'url': The URL of your Keycloak server.
     * 'realm': The realm within Keycloak.
     * 'clientId': The ID of the client application registered in Keycloak.
     */
    keycloakConfig: KeycloakConfig;
    /**
     * The URI to redirect to after logout.
     */
    keycloakLogoutOptions?: KeycloakLogoutOptions;
    /**
     * The URI to redirect to after successful login.
     */
    keycloakLoginOptions?: KeycloakLoginOptions;
}

export class KeycloakAuthPlugin
    extends EventEmitter<AuthPluginEvents>
    implements Service, AuthPlugin
{
    declare [DECLARE_SERVICE_INTERFACE]: "authentication-keycloak.KeycloakAuthPlugin";

    #state: AuthState = {
        kind: "pending"
    };
    #keycloak: Keycloak;
    #logoutOptions: KeycloakLogoutOptions;
    #loginOptions: KeycloakLoginOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timerId: any;

    constructor(options: ServiceOptions) {
        super();
        this.#logoutOptions = { redirectUri: undefined };
        this.#loginOptions = { redirectUri: undefined };
        const { refreshOptions, keycloakInitOptions, keycloakConfig } = getKeycloakConfig(
            options.properties
        );

        this.#keycloak = new Keycloak(keycloakConfig);

        this.#keycloak
            .init(keycloakInitOptions)
            .then((data) => {
                if (data) {
                    this.#state = {
                        kind: "authenticated",
                        sessionInfo: {
                            userId: this.#keycloak.subject ? this.#keycloak.subject : "undefined",
                            attributes: {
                                keycloak: this.#keycloak,
                                familyName: this.#keycloak.idTokenParsed?.family_name,
                                givenName: this.#keycloak.idTokenParsed?.given_name,
                                userName: this.#keycloak.idTokenParsed?.preferred_username
                            }
                        }
                    };
                    this.emit("changed");

                    LOG.debug(`User ${this.#keycloak.subject} is authenticated`);

                    if (refreshOptions.autoRefresh) {
                        LOG.debug("Starting auto-refresh", refreshOptions);
                        this.refresh(refreshOptions.interval, refreshOptions.timeLeft);
                    }
                } else {
                    this.#state = {
                        kind: "not-authenticated"
                    };
                    this.emit("changed");
                    LOG.debug("User is not authenticated");
                }
            })
            .catch((e) => {
                this.#state = {
                    kind: "not-authenticated"
                };
                this.emit("changed");
                LOG.error("Failed to check if user is authenticated", e);
            });
    }

    getAuthState(): AuthState {
        return this.#state;
    }

    getLoginBehavior(): LoginBehavior {
        const doLogin = () => {
            LOG.debug("Login with options", this.#loginOptions);
            this.#keycloak.login(this.#loginOptions);
        };
        return {
            kind: "effect",
            login: doLogin
        };
    }

    logout() {
        LOG.debug("Logout with options", this.#logoutOptions);
        this.#keycloak.logout(this.#logoutOptions);
    }

    refresh(interval: number, timeLeft: number) {
        clearInterval(this.#timerId);
        this.#timerId = setInterval(() => {
            this.#keycloak.updateToken(timeLeft).catch((e) => {
                LOG.error("Failed to refresh token", e);
                this.#state = {
                    kind: "not-authenticated"
                };
                this.emit("changed");
                this.destroy();
            });
        }, interval);
    }

    destroy() {
        clearInterval(this.#timerId);
        this.#timerId = undefined;
    }
}

const DEFAULT_AUTO_REFRESH_OPT = {
    autoRefresh: true,
    interval: 6000,
    timeLeft: 70
};

const DEFAULT_INIT_OPT = {
    onLoad: "check-sso",
    pkceMethod: "S256",
    scope: "data:read"
};

export function getKeycloakConfig(properties: Partial<KeycloakProperties>): KeycloakOptions {
    const { keycloakOptions } = properties;

    const { refreshOptions, keycloakInitOptions, keycloakConfig } = keycloakOptions!;

    return {
        refreshOptions: { ...getRefreshOpt(refreshOptions) },
        keycloakInitOptions: { ...getInitOpt(keycloakInitOptions) },
        keycloakConfig: { ...getConfigOpt(keycloakConfig) }
    };
}

function getRefreshOpt(autoRefreshOptions: RefreshOptions | undefined): RefreshOptions {
    if (!autoRefreshOptions || isObjectEmpty(autoRefreshOptions)) {
        LOG.warn(
            `The autorefresh options of the Keycloak configuration should be set to ensure automatic refreshes at specified intervals.` +
                ` Defaulting to '${DEFAULT_AUTO_REFRESH_OPT}'.`
        );
        return Object.assign({}, { ...DEFAULT_AUTO_REFRESH_OPT });
    }
    return autoRefreshOptions;
}

function getInitOpt(keycloakInitOptions: KeycloakInitOptions | undefined): KeycloakInitOptions {
    if (!keycloakInitOptions || isObjectEmpty(keycloakInitOptions)) {
        LOG.warn(
            `The Keycloak init options of the keycloak configuration should be set.` +
                ` Defaulting to '${DEFAULT_INIT_OPT}'.`
        );
        return Object.assign({}, { ...DEFAULT_INIT_OPT }) as KeycloakInitOptions;
    }
    return keycloakInitOptions;
}

function getConfigOpt(keycloakConfig: KeycloakConfig | undefined): KeycloakConfig {
    if (!keycloakConfig || isObjectEmpty(keycloakConfig)) {
        throw new Error(
            `KeycloakConfig not found: The Keycloak configuration options are required by the plugin to perform login and logout operations`
        );
    }
    return keycloakConfig;
}

const isObjectEmpty = (objectName: unknown) => {
    return objectName && Object.keys(objectName).length === 0 && objectName.constructor === Object;
};
