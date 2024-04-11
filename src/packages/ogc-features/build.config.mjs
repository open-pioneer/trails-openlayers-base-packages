// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
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
