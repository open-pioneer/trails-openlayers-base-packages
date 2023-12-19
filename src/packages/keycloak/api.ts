// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Keycloak, {
    KeycloakInitOptions,
    KeycloakLoginOptions,
    KeycloakLogoutOptions
} from "keycloak-js";
import "@open-pioneer/runtime";

export interface KeycloakConfigProvider {
    getKeycloak(): Keycloak;
    getInitOptions(): KeycloakInitOptions;
    getLoginOptions(): KeycloakLoginOptions;
    getLogoutOptions(): KeycloakLogoutOptions;
    getRefreshOptions(): {
        autoRefresh: boolean;
        interval: number;
        timeLeft: number;
    };
}

declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "keycloak.KeycloakConfigProvider": KeycloakConfigProvider;
    }
}
