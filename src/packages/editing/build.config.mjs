// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    i18n: ["en", "de"],
    services: {
        EditingImpl: {
            provides: "editing.Editing",
            references: {
                mapRegistry: "map.MapRegistry",
                httpService: "http.HttpService"
            }
        }
    },
    properties: {
        // See Open Pioneer "trails-starter" in "Providing helpers for package properties"
        // Idea: create style object for create, update (, delete?) for different geometry types
        // create: {
        //     point: {},
        //     linestring: {},
        //     polygon: {}
        // },
        polygonDrawStyle: {
            "stroke-color": "yellow",
            "stroke-width": 2,
            "fill-color": "rgba(0, 0, 0, 0.1)"
        }
    },
    publishConfig: {
        strict: true
    }
});
