// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { GeometryCollection } from "ol/geom";
import OlMap from "ol/Map";

export interface ResultHandlerOptions {
    /**
     * The olMap.
     */
    olMap: OlMap;

    /**
     * The layer shown in the overview map.
     */
    geometries: GeometryCollection;

    /**
     * The zoomto-scale for point results
     */
    zoom?: number;

    /**
     * The zoomto-max-scale for polygon and line results.
     */
    maxZoom?: number;
}

/**
 * This function shows the position of a text search result zoomed to and marked or highlighted in the map.
 */
export function resultHandler(options: ResultHandlerOptions) {
    //const { olMap, geometries, zoom, maxZoom } = options;
}
