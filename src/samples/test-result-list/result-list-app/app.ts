// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";

const params = new URLSearchParams(window.location.search);
const lang = params.get("lang");

const element = createCustomElement({
    component: AppUI,
    appMetadata,
    config: {
        locale: lang === "de" || lang === "en" ? lang : undefined
    }
});

customElements.define("result-list-app", element);
