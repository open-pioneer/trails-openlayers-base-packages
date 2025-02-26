// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./ui/AppUI";

// This reads the `lang` parameter from the URL and uses it for the application's locale.
const URL_PARAMS = new URLSearchParams(window.location.search);
const FORCED_LANG = URL_PARAMS.get("lang") || undefined;

const element = createCustomElement({
    component: AppUI,
    appMetadata,
    config: {
        locale: FORCED_LANG,
        properties: {
            "@open-pioneer/local-storage": {
                "storageId": "ol-app-state"
            }
        }
    }
});

customElements.define("ol-map-app", element);
