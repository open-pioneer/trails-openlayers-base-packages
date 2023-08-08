// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { OlComponentProps, useMap } from "@open-pioneer/experimental-ol-map";
import { HTMLAttributes, useEffect, useState } from "react";
import { Text } from "@open-pioneer/chakra-integration";

import Map from "ol/Map.js";
import { unByKey } from "ol/Observable";

/**
 * From Web Map Server Implementation Specification -> 7.2.4.6.9 Scale denominators
 *
 * For the purposes of this International Standard, the common pixel size is defined to be 0,28 mm × 0,28 mm.
 * Because arbitrary clients can request maps from a server, the true pixel size of the final rendering device is
 * unknown to the server.
 */
const DOTS_PER_INCH = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;

export function ScaleViewerComponent(props: OlComponentProps & HTMLAttributes<HTMLDivElement>) {
    const { mapId, ...rest } = props;
    const { map } = useMap(mapId);

    const resolution = useResolution(map);
    const scale = useScale(map, resolution);

    return (
        <div className="scale-viewer-wrapper" {...rest}>
            {scale && <Text>1:{scale}</Text>}
        </div>
    );
}

/**
 * Detect change of map scale and return scale | undefined
 */
function useScale(map: Map | undefined, resolution: number | undefined): number | undefined {
    const [scale, setScale] = useState<number | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }
        if (!resolution) {
            return;
        }

        const projection = map.getView().getProjection();
        if (!projection) {
            return;
        }

        const metersPerUnit: number | undefined = projection.getMetersPerUnit();
        if (!metersPerUnit) {
            return;
        }

        setScale(Math.round(resolution * metersPerUnit * DOTS_PER_INCH * INCHES_PER_METRE));
    }, [map, resolution]);

    return scale;
}

/**
 * Detect change of map resolution and return resolution | undefined
 */
function useResolution(map: Map | undefined): number | undefined {
    const [resolution, setResolution] = useState<number | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }

        const eventsKey = map.on("moveend", () => {
            const newResolution = map.getView().getResolution();
            if (resolution != newResolution) {
                setResolution(newResolution);
            }
        });

        () => unByKey(eventsKey);
    }, [map, resolution]);

    return resolution;
}
