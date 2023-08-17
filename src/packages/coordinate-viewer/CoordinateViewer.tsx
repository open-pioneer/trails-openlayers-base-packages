// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { OlComponentProps, useMap } from "@open-pioneer/experimental-ol-map";
import { useEffect, useMemo, useState } from "react";
import { Box, Text, BoxProps } from "@open-pioneer/chakra-integration";

import Map from "ol/Map.js";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { useIntl } from "open-pioneer:react-hooks";
import classNames from "classnames";

const DEFAULT_PRECISION = 4;

// Todo inline documentation

export function CoordinateViewer(
    props: OlComponentProps & { precision?: number } & BoxProps & {
            /**
             * Additional class name(s).
             */
            className?: string;
        }
) {
    const { mapId, precision, className, ...rest } = props;
    const { map } = useMap(mapId);

    const { coordinates } = useCoordinates(map);

    const projection = useMemo(() => {
        return getProjection(map);
    }, [map]);
    const coordinatesString = useFormatting(coordinates, precision);

    const displayString = coordinatesString ? coordinatesString + " " + projection : "";

    return (
        <Box className={classNames("coordinate-viewer", className)} {...rest}>
            {<Text className="coordinate-viewer-text">{displayString}</Text>}
        </Box>
    );
}

function useCoordinates(map: Map | undefined): { coordinates: Coordinate | undefined } {
    const [coordinates, setCoordinates] = useState<Coordinate | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }

        const eventsKey: EventsKey = map.on("pointermove", (evt) => {
            setCoordinates(evt.coordinate);
        });

        return () => unByKey(eventsKey);
    }, [map, coordinates]);

    return { coordinates: coordinates };
}

export function useFormatting(
    coordinates: Coordinate | undefined,
    configuredPrecision: number | undefined
): string {
    const intl = useIntl();

    if (coordinates && coordinates[0] != undefined && coordinates[1] != undefined) {
        // todo transformation

        const precision = configuredPrecision || DEFAULT_PRECISION;
        const x = coordinates[0];
        const y = coordinates[1];

        const xString = intl.formatNumber(x, {
            maximumFractionDigits: precision,
            minimumFractionDigits: precision
        });
        const yString = intl.formatNumber(y, {
            maximumFractionDigits: precision,
            minimumFractionDigits: precision
        });

        const coordinatesString = xString + " " + yString;
        return coordinatesString;
    }
    return "";
}

function getProjection(map: Map | undefined): string {
    if (map) {
        const projection = map.getView().getProjection().getCode();
        return projection;
    }
    return "";
}
