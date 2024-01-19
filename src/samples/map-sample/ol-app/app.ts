// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import { theme } from "@open-pioneer/theme";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";

const element = createCustomElement({
    component: AppUI,
    theme,
    appMetadata,
    config: {
        properties: {
            "@open-pioneer/local-storage": {
                "storageId": "ol-app-state"
            },
            "@open-pioneer/editing": {
                "polygonDrawStyle": {
                    "stroke-color": "red",
                    "stroke-width": 2,
                    "fill-color": "rgba(0, 0, 0, 0.1)",
                    "circle-radius": 5,
                    "circle-fill-color": "rgba(255, 0, 0, 0.2)",
                    "circle-stroke-color": "rgba(255, 0, 0, 0.7)",
                    "circle-stroke-width": 2
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

customElements.define("ol-map-app", element);
