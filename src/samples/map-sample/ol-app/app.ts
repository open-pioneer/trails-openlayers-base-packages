// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import { theme } from "@open-pioneer/theme";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./ui/AppUI";

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
                "polygonStyle": {
                    "fill-color": "rgba(255,255,255,0.4)",
                    "stroke-color": "red",
                    "stroke-width": 2,
                    "circle-radius": 5,
                    "circle-fill-color": "red",
                    "circle-stroke-width": 1.25,
                    "circle-stroke-color": "red"
                },
                "vertexStyle": {
                    "circle-radius": 5,
                    "circle-fill-color": "red",
                    "circle-stroke-width": 1.25,
                    "circle-stroke-color": "red"
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
