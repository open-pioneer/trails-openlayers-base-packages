// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ApplicationConfig, createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./ui/AppUI";
import configUrl from "/config.json?url";

console.error("configUrl", configUrl);

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
    },
    async resolveConfig(ctx): Promise<ApplicationConfig> {
        const targetUrl = new URL("../../../public/config.json", import.meta.url);
        const config = await (await fetch(targetUrl)).json();
        return {
            properties: {
                "ol-map": {
                    "userConfig": config
                }
            }
        };
    },
});

customElements.define("ol-map-app", element);
