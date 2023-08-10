// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { OlComponentProps, useMap } from "@open-pioneer/experimental-ol-map";
import { HTMLAttributes, useEffect, useState } from "react";
import { Text } from "@open-pioneer/chakra-integration";

import Map from "ol/Map.js";
import { unByKey } from "ol/Observable";
import { Projection, getPointResolution } from "ol/proj";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";

/**
 * From Web Map Server Implementation Specification -> 7.2.4.6.9 Scale denominators
 *
 * For the purposes of this International Standard, the common pixel size is defined to be 0,28 mm × 0,28 mm.
 * Because arbitrary clients can request maps from a server, the true pixel size of the final rendering device is
 * unknown to the server.
 */
const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;

export function ScaleViewerComponent(props: OlComponentProps & HTMLAttributes<HTMLDivElement>) {
    const { mapId, ...rest } = props;
    const { map } = useMap(mapId);

    const { resolution } = useResolution(map);
    const { scale } = useScale(map, resolution);

    return (
        <div className="scale-viewer-wrapper" {...rest}>
            {scale && <Text>1:{Intl.NumberFormat().format(scale)}</Text>}
        </div>
    );
}

/**
 * Detect change of map scale and return scale | undefined
 */
export function useScale(
    map: Map | undefined,
    resolution: number | undefined
): { scale: number | undefined } {
    const [scale, setScale] = useState<number | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }
        if (!resolution) {
            return;
        }

        const projection: Projection = map.getView().getProjection();
        if (!projection) {
            return;
        }

        const center: Coordinate | undefined = map.getView().getCenter();
        if (!center) {
            return;
        }

        const pointResolution: number = getPointResolution(projection, resolution, center);

        /**
         * Returns the appropriate scale for the given resolution and units, see OpenLayers function getScaleForResolution()
         * https://github.com/openlayers/openlayers/blob/7fa9df03431e9e1bc517e6c414565d9f848a3132/src/ol/control/ScaleLine.js#L454C3-L454C24
         */
        setScale(Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI));
    }, [map, resolution]);

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

        const eventsKey: EventsKey = map.on("moveend", () => {
            const newResolution = map.getView().getResolution();
            if (resolution != newResolution) {
                setResolution(newResolution);
            }
        });

        () => unByKey(eventsKey);
    }, [map, resolution]);

    return { resolution };
}
