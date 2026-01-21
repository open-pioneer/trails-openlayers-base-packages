// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfigWithDefaults } from "openlayers-base-packages/support/defineBuildConfigWithDefaults.mjs";

export default defineBuildConfigWithDefaults({
    entryPoints: ["index"],
    services: {
        VectorSourceFactory: {
            provides: "ogc-features.VectorSourceFactory",
            references: {
                httpService: "http.HttpService"
            }
        },
        SearchSourceFactory: {
            provides: "ogc-features.SearchSourceFactory",
            references: {
                httpService: "http.HttpService"
            }
        }
    },
    publishConfig: {
        strict: true
    }
});
