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
        /**
         * See documentation "Providing helpers for package properties" in Open Pioneer "trails-starter"
         * https://github.com/open-pioneer/trails-starter/blob/main/docs/reference/Services.md#providing-helpers-for-package-properties
         */
        polygonStyle: {
            "fill-color": "rgba(255,255,255,0.4)",
            "stroke-color": "#3399CC",
            "stroke-width": 1.25,
            // circle props used for mouse position circle while editing
            "circle-radius": 5,
            "circle-fill-color": "rgba(255,255,255,0.4)",
            "circle-stroke-width": 1.25,
            "circle-stroke-color": "#3399CC"
        },
        vertexStyle: {
            // circle props used for vertices
            "circle-radius": 5,
            "circle-fill-color": "rgba(255,255,255,0.4)",
            "circle-stroke-width": 1.25,
            "circle-stroke-color": "#3399CC"
        }
    },
    publishConfig: {
        strict: true
    }
});
