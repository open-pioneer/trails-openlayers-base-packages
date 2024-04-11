// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["de", "en"],
    services: {
        KeycloakAuthPlugin: {
            provides: ["authentication-keycloak.KeycloakAuthPlugin"]
        },

        MapConfigProviderImpl: {
            provides: ["map.MapConfigProvider"],
            references: {
                vectorSourceFactory: "ogc-features.VectorSourceFactory"
            }
        },
        SampleTokenInterceptor: {
            provides: ["http.Interceptor"],
            references: {
                keycloackAuthPlugin: "authentication.AuthService"
            }
        }
    },

    ui: {
        references: ["authentication.AuthService"]
    }
});
