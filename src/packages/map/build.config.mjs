// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index", "internalTestSupport"],
    styles: "./ui/styles.css",
    services: {
        MapRegistryImpl: {
            provides: ["map.MapRegistry"],
            references: {
                providers: {
                    name: "map.MapConfigProvider",
                    all: true
                },
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
