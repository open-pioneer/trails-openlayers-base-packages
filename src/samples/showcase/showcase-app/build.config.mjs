// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en", "de"],
    styles: "./styles.scss",
    services: {
        MapConfigProviderImpl: {
            provides: ["map.MapConfigProvider"],
            references: {
                vectorSourceFactory: "ogc-features.VectorSourceFactory"
            }
        },
        AppInitModel: {
            provides: ["app.AppInitModel"],
            references: {
                httpService: "http.HttpService",
                mapRegistry: "map.MapRegistry",
                notifier: "notifier.NotificationService",
                vectorSelectionSourceFactory: "selection.VectorSelectionSourceFactory",
                editingService: "editing.EditingService",
                notificationService: "notifier.NotificationService"
            }
        }
    },
    ui: {
        references: ["app.AppInitModel", "runtime.ApplicationContext"]
    }
});
