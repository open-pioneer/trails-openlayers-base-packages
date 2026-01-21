// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfigWithDefaults } from "openlayers-base-packages/support/defineBuildConfigWithDefaults.mjs";

export default defineBuildConfigWithDefaults({
    entryPoints: ["index"],
    i18n: ["en", "de"],
    ui: {
        references: ["notifier.NotificationService", "map.LayerFactory"]
    },
    publishConfig: {
        strict: true
    }
});
