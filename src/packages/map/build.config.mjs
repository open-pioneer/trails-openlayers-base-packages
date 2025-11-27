// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    i18n: ["de", "en"],
    entryPoints: ["index", "internalTestSupport"],
    styles: "./ui/styles.css",
    services: {
        MapRegistry: {
            provides: ["map.MapRegistry"],
            references: {
                providers: {
                    name: "map.MapConfigProvider",
                    all: true
                },
                httpService: "http.HttpService",
                layerFactory: "map.LayerFactory"
            }
        },
        LayerFactory: {
            provides: ["map.LayerFactory"],
            references: {
                httpService: "http.HttpService"
            }
        }
    },
    ui: {
        references: ["map.MapRegistry"]
    },
    publishConfig: {
        strict: true
    }
});
