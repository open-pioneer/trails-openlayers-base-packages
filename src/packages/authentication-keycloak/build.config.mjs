// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index.ts"],
    services: {
        KeycloakAuthPlugin: {
            provides: [
                // The generic interface, used by the AuthService
                "authentication.AuthPlugin",

                // Concrete interface for this plugin (note: no additional API yet).
                "authentication-keycloak.KeycloakAuthPlugin"
            ]
        }
    },
    properties: {
        keycloakOptions: {
            refreshOptions: null,
            keycloakInitOptions: null,
            keycloakConfig: null,
            keycloakLogoutOptions: null,
            keycloakLoginOptions: null
        }
    }
});
