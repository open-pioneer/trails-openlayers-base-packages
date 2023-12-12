// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    AuthPlugin,
    AuthPluginEvents,
    AuthState,
    LoginBehavior
} from "@open-pioneer/authentication";
import { EventEmitter } from "@open-pioneer/core";
import { Service, ServiceOptions, ServiceType } from "@open-pioneer/runtime";
import Keycloak from "keycloak-js";

interface References {
    config: ServiceType<"keycloak.KeycloakConfigProvider">;
}

export class KeycloakAuthPlugin
    extends EventEmitter<AuthPluginEvents>
    implements Service, AuthPlugin
{
    #state: AuthState = {
        kind: "pending"
    };
    #wasLoggedIn = false;
    #keycloak: Keycloak;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #timerId: any;

    constructor(options: ServiceOptions<References>) {
        super();
        const config = options.references.config;
        const refreshOptions = config.getRefreshOptions();
        this.#keycloak = config.getKeycloak();
        this.#keycloak.init(config.getInitOptions()).then((data) => {
            if (data) {
                this.#state = {
                    kind: "authenticated",
                    sessionInfo: {
                        userId: this.#keycloak.subject ? this.#keycloak.subject : "undefined",
                        attributes: {
                            keycloak: this.#keycloak
                        }
                    }
                };
                this.emit("changed");
                if (refreshOptions.autoRefresh) {
                    this.refresh(refreshOptions.interval, refreshOptions.timeLeft);
                }
            } else {
                this.#state = {
                    kind: "not-authenticated"
                };
                this.emit("changed");
            }
        });
    }

    getAuthState(): AuthState {
        console.log(this.#keycloak.subject);
        return this.#state;
    }

    getLoginBehavior(): LoginBehavior {
        const doLogin = () => {
            this.#keycloak.login();
        };
        return {
            kind: "effect",
            login: doLogin
        };
    }

    logout() {
        this.#keycloak.logout();
    }

    refresh(interval: number, timeLeft: number) {
        this.#timerId = setInterval(() => {
            this.#keycloak
                .updateToken(timeLeft)
                .then((refreshed) => {
                    if (refreshed) {
                        console.log("Token refreshed");
                    } else {
                        console.log("Token still valid");
                    }
                })
                .catch(() => {
                    console.log("Failed to refresh token");
                });
        }, interval);
    }

    destroy() {
        clearInterval(this.#timerId);
        this.#timerId = undefined;
    }
}
