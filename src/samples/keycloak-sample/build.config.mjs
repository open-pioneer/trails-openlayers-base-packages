// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        KeycloakConfigProviderImpl: {
            provides: "keycloak.KeycloakConfigProvider"
        },
        KeycloakAuthPlugin: {
            provides: "authentication.AuthPlugin",
            references: {
                config: "keycloak.KeycloakConfigProvider"
            }
        }
    },

    ui: {
        references: ["authentication.AuthService"]
    }
});
