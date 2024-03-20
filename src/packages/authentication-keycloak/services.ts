// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Keycloak, {
    KeycloakInitOptions,
    KeycloakLoginOptions,
    KeycloakLogoutOptions
} from "keycloak-js";
import { KeycloakConfigProvider } from "./api";
/*export const keycloak = new Keycloak({
    url: "https://auth.ldproxy.net/",
    realm: "ii",
    clientId: "it-nrw"
});

export const keycloak = new Keycloak({
    url: "https://hsi-pex0-13620.service.it.nrw.de/keycloak/",
    realm: "trails",
    clientId: "trails-sample"
});
*/
let uKeycloak = new Keycloak();

export class KeycloakConfigProviderImpl implements KeycloakConfigProvider {
    setKeycloak(keycloak: Keycloak) {
        uKeycloak = keycloak;
        return keycloak;
    }

    getInitOptions(
        options: KeycloakInitOptions | undefined = {
            onLoad: "check-sso",
            pkceMethod: "S256",
            scope: "data:read"
        }
    ) {
        return options;
    }

    getLoginOptions(options: KeycloakLoginOptions | undefined = { redirectUri: undefined }) {
        return options;
    }

    getLogoutOptions(options: KeycloakLogoutOptions | undefined = { redirectUri: undefined }) {
        return options;
    }

    getRefreshOptions(
        options: { autoRefresh: boolean; interval: number; timeLeft: number } | undefined = {
            autoRefresh: true,
            interval: 6000,
            timeLeft: 70
        }
    ) {
        return options;
    }
}

export { uKeycloak };
