// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import Map from "ol/Map.js";
import { unByKey } from "ol/Observable";
import { Projection, getPointResolution } from "ol/proj";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { useEffect, useState } from "react";

/**
 * From Web Map Server Implementation Specification -> 7.2.4.6.9 Scale denominators
 *
 * For the purposes of this International Standard, the common pixel size is defined to be 0,28 mm × 0,28 mm.
 * Because arbitrary clients can request maps from a server, the true pixel size of the final rendering device is
 * unknown to the server.
 */
const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;

/**
 * Detect change of map scale and return scale | undefined
 */
export function useScale(
    map: Map | undefined,
    resolution: number | undefined,
    center: Coordinate | undefined
): { scale: number | undefined } {
    const [scale, setScale] = useState<number | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }
        if (!resolution) {
            return;
        }

        if (!center) {
            return;
        }

        const projection: Projection = map.getView().getProjection();
        if (!projection) {
            return;
        }

        const pointResolution: number = getPointResolution(projection, resolution, center);

        /**
         * Returns the appropriate scale for the given resolution and units, see OpenLayers function getScaleForResolution()
         * https://github.com/openlayers/openlayers/blob/7fa9df03431e9e1bc517e6c414565d9f848a3132/src/ol/control/ScaleLine.js#L454C3-L454C24
         */
        setScale(Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI));
    }, [map, center, resolution]);

    return { scale };
}

/**
 * Detect change of map resolution and return resolution | undefined
 */
export function useResolution(map: Map | undefined): { resolution: number | undefined } {
    const [resolution, setResolution] = useState<number | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }

        const view = map.getView();

        // set initial map resolution
        setResolution(view.getResolution());

        const eventsKey: EventsKey = view.on("change:resolution", () => {
            const newResolution = view.getResolution();

            if (resolution != newResolution) {
                setResolution(newResolution);
            }
        });

        return () => unByKey(eventsKey);
    }, [map, resolution]);

    return { resolution };
}

/**
 * Detect change of map center and return center | undefined
 */
export function useCenter(map: Map | undefined): { center: Coordinate | undefined } {
    const [center, setCenter] = useState<Coordinate | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }

        const view = map.getView();

        // set initial map center
        setCenter(view.getCenter());

        const eventsKey: EventsKey = view.on("change:center", () => {
            const newCenter = view.getCenter();

            if (center != newCenter) {
                setCenter(newCenter);
            }
        });

        return () => unByKey(eventsKey);
    }, [map, center]);

    return { center };
}
