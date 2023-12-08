// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    AuthPlugin,
    AuthPluginEvents,
    AuthState,
    LoginBehavior
} from "@open-pioneer/authentication";
import { EventEmitter } from "@open-pioneer/core";
import { Service } from "@open-pioneer/runtime";
import Keycloak from "keycloak-js";

export interface KeycloakConfig{
    url: string;
    realm: string; 
    clientID: string;
}

export let keycloak: Keycloak;

export async function init(options: KeycloakConfig){

    keycloak = new Keycloak({
        url: options.url,
        realm: options.realm,
        clientId: options.clientID
    });

    return keycloak.init({onLoad: "check-sso"});

}

export async function setup2(keycloak2: Keycloak){

    keycloak = keycloak2;

    return keycloak.init({onLoad: "check-sso"});

}

export class KeycloakAuthPlugin extends EventEmitter<AuthPluginEvents> implements Service, AuthPlugin {
    #state: AuthState = {
        kind: "not-authenticated"
    };
    #wasLoggedIn = false;

    constructor() {
        super();
    }

    getAuthState(): AuthState {
        return this.#state;
    }

    getLoginBehavior(): LoginBehavior {
        const doLogin = () => {
            if (keycloak.authenticated) {
                this.#state = {
                    kind: "authenticated",
                    sessionInfo: {
                        userId: keycloak.subject ? keycloak.subject : "undefined", 
                        attributes: {
                            keycloak
                        }
                    }
                };
                this.#wasLoggedIn = true;
                this.emit("changed");
            } else {
                keycloak.login();
            }
        };
        
        return {
            kind: "effect",
            login: doLogin
        };
    }

    logout() {
        keycloak.logout();
    }
}