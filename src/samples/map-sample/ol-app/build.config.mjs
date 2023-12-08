// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    styles: "./app.css",
    i18n: ["en", "de"],
    services: {
        MapConfigProviderImpl: {
            provides: ["map.MapConfigProvider"]
        },
        AppConfig: {
            provides: "ol-app.AppConfig"
        }
    },
    ui: {
        references: ["map-sample-logging.LogService", "map.MapRegistry", "ol-app.AppConfig"]
    }
});
