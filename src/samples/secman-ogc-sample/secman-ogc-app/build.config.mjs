// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en", "de"],
    services: {
        // Configures the map
        MapConfigService: {
            provides: "map.MapConfigProvider",
            references: {
                authService: "authentication.AuthService"
            }
        },
        // Appends tokens to http requests
        TokenInterceptor: {
            provides: "http.Interceptor",
            references: {
                authService: "authentication.AuthService"
            }
        }
    },
    ui: {
        references: ["authentication.AuthService"]
    }
});
