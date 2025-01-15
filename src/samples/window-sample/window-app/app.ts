// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { WindowApp } from "./tsx/WindowApp";

const URL_PARAMS = new URLSearchParams(window.location.search);
const FORCED_LANG = URL_PARAMS.get("lang") || undefined;

const Element = createCustomElement({
    component: WindowApp,
    appMetadata,
    config: {
        locale: FORCED_LANG
    }
});

customElements.define("window-app", Element);
