// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@open-pioneer/chakra-integration";
import { useMapModel, useProjection } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { transform } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";

const DEFAULT_PRECISION = 4;
const DEFAULT_DISPLAY_DEGREE = false;

/**
 * These are special properties for the CoordinateViewer.
 */
export interface CoordinateViewerProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Number of decimal places shown for coordinates.
     */
    precision?: number;

    /**
     * Projection of the coordinates shown in the rendered HTML, does not affect the map projection
     */
    displayProjectionCode?: string;

    /**
     * Projection of the coordinates shown in the rendered HTML as Degree Format, does not affect the map projection
     */
    displayProjectionAsDegree?: boolean;
}

/**
 * The `CoordinateViewer`component can be used in an app to render the coordinates at the current mouse position.
 */
export const CoordinateViewer: FC<CoordinateViewerProps> = (props) => {
    const { mapId, precision, displayProjectionCode, displayProjectionAsDegree } = props;
    const { containerProps } = useCommonComponentProps("coordinate-viewer", props);
    const { map } = useMapModel(mapId);
    const olMap = map?.olMap;
    const mapProjectionCode = useProjection(olMap)?.getCode() ?? "";
    let { coordinates } = useCoordinates(olMap);
    coordinates =
        coordinates && displayProjectionCode
            ? transformCoordinates(coordinates, mapProjectionCode, displayProjectionCode)
            : coordinates;
    const coordinatesString = useCoordinatesString(
        coordinates,
        precision,
        displayProjectionAsDegree
    );
    const projectionString = displayProjectionCode ? displayProjectionCode : mapProjectionCode;
    const displayString = coordinatesString ? coordinatesString + " " + projectionString : "";
    return (
        <Box {...containerProps}>
            <Text className="coordinate-viewer-text">{displayString}</Text>
        </Box>
    );
};

/* Separate function for easier testing */
export function useCoordinatesString(
    coordinates: number[] | undefined,
    precision: number | undefined,
    displayProjectionAsDegree: boolean | undefined
): string {
    const intl = useIntl();
    const coordinatesString = coordinates
        ? formatCoordinates(coordinates, precision, intl, displayProjectionAsDegree)
        : "";
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
    intl: PackageIntl,
    displayProjectionAsDegree: boolean | undefined
) {
    if (coordinates[0] == null || coordinates[1] == null) {
        return "";
    }

    const precision = configuredPrecision ?? DEFAULT_PRECISION;
    const asDegree = displayProjectionAsDegree ?? DEFAULT_DISPLAY_DEGREE;
    const [x, y] = coordinates;

    if (asDegree && isFinite(x) && isFinite(y)) {
        const [xHour, xMin, xSek] = toDegree(x, intl, precision);
        const [yHour, yMin, ySek] = toDegree(y, intl, precision);

        const xString = `${Math.abs(xHour)}°${xMin}'${xSek}"${0 <= xHour ? "(E)" : "(W)"}`;
        const yString = `${Math.abs(yHour)}°${yMin}'${ySek}"${0 <= yHour ? "(N)" : "(S)"}`;

        const coordinatesString = xString + " " + yString;
        return coordinatesString;
    } else {
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
}

function toDegree(
    coordPart: number,
    intl: PackageIntl,
    precision: number
): [number, number, string] {
    const cHour = Math.floor(coordPart);
    const cNach = coordPart - cHour;

    const cMin = Math.floor(60 * cNach);

    const cMinNach = 60 * cNach - cMin;

    const cSek = 60 * cMinNach;
    const cSekRounded = intl.formatNumber(cSek, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision
    });

    return [cHour, cMin, cSekRounded];
}

function transformCoordinates(
    coordinates: number[],
    source: string,
    destination: string
): number[] {
    const transformed = transform(coordinates, source, destination);
    return transformed;
}
