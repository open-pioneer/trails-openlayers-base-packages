// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["en", "de"],
    services: {
        MapConfigProviderImpl: {
            provides: ["map.MapConfigProvider"]
        },
        AppInitModel: {
            provides: ["app.AppInitModel"],
            references: {
                httpService: "http.HttpService",
                mapRegistry: "map.MapRegistry"
            }
        }
    },
    ui: {
        references: ["app.AppInitModel", "runtime.ApplicationContext"]
    }
});
