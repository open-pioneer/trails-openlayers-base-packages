// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./ui/AppUI";

const URL_PARAMS = new URLSearchParams(window.location.search);
const FORCED_LANG = URL_PARAMS.get("lang") || undefined;

const element = createCustomElement({
    component: AppUI,
    appMetadata,
    config: {
        properties: {
            "@open-pioneer/local-storage": {
                "storageId": "ol-showcase-state"
            }
        }
    },
    async resolveConfig(ctx) {
        const embedded = ctx.getAttribute("embedded") === "true";
        return {
            properties: {
                "showcase-app": {
                    embedded
                }
            },
            locale: !embedded ? FORCED_LANG : undefined
        };
    }
});

customElements.define("showcase-app", element);
