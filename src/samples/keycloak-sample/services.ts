// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Keycloak from "keycloak-js";
export { KeycloakAuthPlugin } from "./keycloak-auth-plugin/KeycloakAuthPlugin";

export class KeycloakConfigProvider {
    getKeycloak() {
        return new Keycloak({
            url: "https://auth.ldproxy.net/",
            realm: "ii",
            clientId: "it-nrw"
        });
    }

    getInitOptions() {
        return {
            onLoad: "check-sso",
            pkceMethod: "S256"
        };
    }

    getLoginOptions() {
        return {};
    }

    getLogoutOptions() {
        return {};
    }

    getRefreshOptions() {
        return {
            autoRefresh: true,
            interval: 6000,
            timeLeft: 70
        };
    }
}
