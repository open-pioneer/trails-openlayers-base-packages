// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    styles: "./app.css",
    i18n: ["en", "de"],
    services: {
        MapConfigProviderImpl: {
            provides: ["map.MapConfigProvider"],
            references: {
                vectorSourceFactory: "ogc-features.VectorSourceFactory"
            }
        },
        AppModel: {
            provides: "ol-app.AppModel",
            references: {
                vectorSelectionSourceFactory: "selection.VectorSelectionSourceFactory",
                httpService: "http.HttpService",
                mapRegistry: "map.MapRegistry"
            }
        }
    },
    ui: {
        references: [
            "map.MapRegistry",
            "ol-app.AppModel",
            "notifier.NotificationService",
            "editing.EditingService",
            "runtime.ApplicationContext"
        ]
    }
});
