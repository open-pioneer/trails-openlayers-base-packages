// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { KeycloakProperties } from "@open-pioneer/authentication-keycloak";
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";

const element = createCustomElement({
    component: AppUI,
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
                        //scope: "data:read"
                    },
                    keycloakConfig: {
                        url: import.meta.env.VITE_KEYCLOAK_CONFIG_URL,
                        realm: import.meta.env.VITE_KEYCLOAK_CONFIG_REALM,
                        clientId: import.meta.env.VITE_KEYCLOAK_CONFIG_CLIENT_ID
                    }
                }
            } satisfies KeycloakProperties
        }
    },
    async resolveConfig(ctx) {
        const locale = ctx.getAttribute("forced-locale");
        if (!locale) {
            return undefined;
        }
        return { locale };
    }
});

customElements.define("keycloak-app-element", element);
