// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    services: {
        KeycloakAuthPlugin: {
            provides: ["authentication.AuthPlugin"]
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
