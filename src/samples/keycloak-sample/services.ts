// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Keycloak, {
    KeycloakInitOptions,
    KeycloakLoginOptions,
    KeycloakLogoutOptions
} from "keycloak-js";
import { KeycloakConfigProvider } from "@open-pioneer/keycloak";
export { KeycloakAuthPlugin } from "@open-pioneer/keycloak";
export { MapConfigProviderImpl } from "./MapConfigProviderImpl";
export const keycloak = new Keycloak({
    url: "https://hsi-pex0-13620.service.it.nrw.de/keycloak/",
    realm: "trails",
    clientId: "trails-sample"
});
export class KeycloakConfigProviderImpl implements KeycloakConfigProvider {
    getKeycloak() {
        return keycloak;
    }

    getInitOptions() {
        return {
            onLoad: "check-sso",
            pkceMethod: "S256"
        } as KeycloakInitOptions;
    }

    getLoginOptions() {
        return {
            redirectUri: undefined
        } as KeycloakLoginOptions;
    }

    getLogoutOptions() {
        return {
            redirectUri: undefined
        } as KeycloakLogoutOptions;
    }

    getRefreshOptions() {
        return {
            autoRefresh: true,
            interval: 6000,
            timeLeft: 70
        };
    }
}
