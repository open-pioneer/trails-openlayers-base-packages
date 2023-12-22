// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    AuthPlugin,
    AuthPluginEvents,
    AuthState,
    LoginBehavior
} from "@open-pioneer/authentication";
import { EventEmitter, createLogger } from "@open-pioneer/core";
import { Service, ServiceOptions, ServiceType } from "@open-pioneer/runtime";
import Keycloak, { KeycloakLoginOptions, KeycloakLogoutOptions } from "keycloak-js";

export interface References {
    config: ServiceType<"keycloak.KeycloakConfigProvider">;
}
//TODO logger name überarbeiten
const LOG = createLogger("keycloak:KeycloakAuthPlugin");

export class KeycloakAuthPlugin
    extends EventEmitter<AuthPluginEvents>
    implements Service, AuthPlugin
{
    #state: AuthState = {
        kind: "pending"
    };
    #wasLoggedIn = false;
    #keycloak: Keycloak;
    #logoutOptions: KeycloakLogoutOptions;
    #loginOptions: KeycloakLoginOptions;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timerId: any;

    constructor(options: ServiceOptions<References>) {
        super();
        const config = options.references.config;

        const refreshOptions = config.getRefreshOptions();
        this.#logoutOptions = config.getLogoutOptions();
        this.#loginOptions = config.getLoginOptions();

        this.#keycloak = config.getKeycloak();
        this.#keycloak
            .init(config.getInitOptions())
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
        this.#timerId = setInterval(() => {
            this.#keycloak.updateToken(timeLeft).catch((e) => {
                LOG.error("Failed to refresh token", e);
            });
        }, interval);
    }

    destroy() {
        clearInterval(this.#timerId);
        this.#timerId = undefined;
    }
}
