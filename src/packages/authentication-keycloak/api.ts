// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import Keycloak, {
    KeycloakInitOptions,
    KeycloakLoginOptions,
    KeycloakLogoutOptions
} from "keycloak-js";
import "@open-pioneer/runtime";

export interface KeycloakConfigProvider {
    setKeycloak(keycloak: Keycloak): Keycloak;
    getInitOptions(options: KeycloakInitOptions | undefined): KeycloakInitOptions;
    getLoginOptions(options: KeycloakLoginOptions | undefined): KeycloakLoginOptions;
    getLogoutOptions(options: KeycloakLogoutOptions | undefined): KeycloakLogoutOptions;
    getRefreshOptions(
        options: { autoRefresh: boolean; interval: number; timeLeft: number } | undefined
    ): {
        autoRefresh: boolean;
        interval: number;
        timeLeft: number;
    };
}

declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "authentication-keycloak.KeycloakConfigProvider": KeycloakConfigProvider;
    }
}
