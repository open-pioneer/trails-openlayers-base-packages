// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["de", "en"],
    services: {
        KeycloakAuthPlugin: {
            provides: ["authentication.AuthPlugin"],
            references: {
                config: "authentication-keycloak.KeycloakConfigProvider"
            }
        },
        MapConfigProviderImpl: {
            provides: ["map.MapConfigProvider"]
        }
    },

    ui: {
        references: ["authentication.AuthService", "authentication-keycloak.KeycloakConfigProvider"]
    }
});
