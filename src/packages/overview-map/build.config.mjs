// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfigWithDefaults } from "openlayers-base-packages/support/defineBuildConfigWithDefaults.mjs";

export default defineBuildConfigWithDefaults({
    i18n: ["de", "en"],
    styles: "./overview-map.scss",
    entryPoints: ["index"],
    publishConfig: {
        strict: true
    }
});
