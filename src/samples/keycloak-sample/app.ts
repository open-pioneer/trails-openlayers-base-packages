// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";
const { VITE_KEYKLOAK_CONFIG_URL, VITE_KEYKLOAK_CONFIG_REALM, VITE_KEYKLOAK_CONFIG_CLIENT_ID } =
    import.meta.env;

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
                        pkceMethod: "S256",
                        scope: "data:read"
                    },
                    keycloakConfig: {
                        url: VITE_KEYKLOAK_CONFIG_URL,
                        realm: VITE_KEYKLOAK_CONFIG_REALM,
                        clientId: VITE_KEYKLOAK_CONFIG_CLIENT_ID
                    }
                }
            }
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
