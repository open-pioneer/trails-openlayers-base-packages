// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    entryPoints: ["index"],
    i18n: ["en", "de"],
    styles: "./editing.css",
    services: {
        EditingServiceImpl: {
            provides: "editing.EditingService",
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
        // Todo: Vertex style
        // Todo: Only one style for create, update, delete
        // Todo: Test with null -> add to documentation: how to disable vertices
        polygonDrawStyle: {
            "stroke-color": "yellow",
            "stroke-width": 2,
            "fill-color": "rgba(0, 0, 0, 0.1)",
            "circle-radius": 5,
            "circle-fill-color": "rgba(0, 0, 255, 0.2)",
            "circle-stroke-color": "rgba(0, 0, 255, 0.7)",
            "circle-stroke-width": 2
        }
    },
    publishConfig: {
        strict: true
    }
});
