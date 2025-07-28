// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { KeycloakProperties } from "@open-pioneer/authentication-keycloak";
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUi } from "./ui/AppUi";

const element = createCustomElement({
    component: AppUi,
    appMetadata,
    config: {
        properties: {
            "@open-pioneer/authentication-keycloak": {
                keycloakOptions: {
                    refreshOptions: {
                        autoRefresh: true,
                        interval: 6000,
                        timeLeft: 70
                    },
                    keycloakInitOptions: {
                        onLoad: "check-sso",
                        pkceMethod: "S256"
                    },
                    // Matches docker-compose.yml
                    keycloakConfig: {
                        url: "http://mylocalhost:8080",
                        realm: "trails",
                        clientId: "trails"
                    }
                }
            } satisfies KeycloakProperties
        }
    }
});

customElements.define("secman-ogc-app", element);
