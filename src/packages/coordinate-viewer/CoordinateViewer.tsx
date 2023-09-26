// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { useMapModel, useProjection } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import classNames from "classnames";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";

const DEFAULT_PRECISION = 4;

/**
 * These are special properties for the CoordinateViewer.
 */
export interface CoordinateViewerProps extends BoxProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Number of decimal places shown for coordinates.
     */
    precision?: number;

    /**
     * Additional css class name(s) that will be added to the CoordinateViewer component.
     */
    className?: string;
}

/**
 * The `CoordinateViewer`component can be used in an app to render the coordinates at the current mouse position.
 */
export const CoordinateViewer: FC<CoordinateViewerProps> = (props) => {
    const { mapId, className, precision, ...rest } = props;
    const { map } = useMapModel(mapId);
    const olMap = map?.olMap;

    const { coordinates } = useCoordinates(olMap);
    const coordinatesString = useCoordinatesString(coordinates, precision);
    const projectionCode = useProjection(olMap)?.getCode() ?? "";
    const displayString = coordinatesString ? coordinatesString + " " + projectionCode : "";
    return (
        <Box className={classNames("coordinate-viewer", className)} {...rest}>
            <Text className="coordinate-viewer-text">{displayString}</Text>
        </Box>
    );
};

/* Separate function for easier testing */
export function useCoordinatesString(
    coordinates: number[] | undefined,
    precision: number | undefined
): string {
    const intl = useIntl();
    const coordinatesString = coordinates ? formatCoordinates(coordinates, precision, intl) : "";
    return coordinatesString;
}

function useCoordinates(map: OlMap | undefined): { coordinates: Coordinate | undefined } {
    const [coordinates, setCoordinates] = useState<Coordinate | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }

        const eventsKey: EventsKey = map.on("pointermove", (evt) => {
            setCoordinates(evt.coordinate);
        });

        return () => unByKey(eventsKey);
    }, [map]);

    return { coordinates };
}

function formatCoordinates(
    coordinates: number[],
    configuredPrecision: number | undefined,
    intl: PackageIntl
) {
    if (coordinates[0] == null || coordinates[1] == null) {
        return "";
    }

    const precision = configuredPrecision ?? DEFAULT_PRECISION;
    const [x, y] = coordinates;

    // improvement: allow transformation into another coordinate system
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
