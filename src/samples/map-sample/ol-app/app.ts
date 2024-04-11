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
