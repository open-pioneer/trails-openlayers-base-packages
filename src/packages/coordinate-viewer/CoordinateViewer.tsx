// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@chakra-ui/react";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { transform } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useMemo, useState } from "react";
import { formatCoordinates } from "./formatCoordinates";

/**
 * These are special properties for the CoordinateViewer.
 */
export interface CoordinateViewerProps extends CommonComponentProps, MapModelProps {
    /**
     * Number of decimal places shown for coordinates.
     */
    precision?: number;

    /**
     * Projection of the coordinates shown in the rendered HTML, does not affect the map projection
     */
    displayProjectionCode?: string;

    /**
     * Configures the display format.
     * By default, the current coordinates are shown as decimal numbers (format: "decimal").
     *
     * If the format is set to "degree", the coordinates are shown in angular degrees (DMS).
     * This can only be used meaningfully (at this time) if the underlying projection provides lat/lon coordinates.
     */
    format?: "decimal" | "degree";
}

/**
 * The `CoordinateViewer` component can be used in an app to render the coordinates at the current mouse position.
 */
export const CoordinateViewer: FC<CoordinateViewerProps> = (props) => {
    const { precision, displayProjectionCode, format } = props;
    const { containerProps } = useCommonComponentProps("coordinate-viewer", props);
    const map = useMapModelValue(props);
    const intl = useIntl();
    const { coordinates, projectionCode } = useCoordinates(map, displayProjectionCode);

    const coordinatesString = useMemo(() => {
        if (!coordinates) {
            return "";
        }
        return formatCoordinates(coordinates, precision, intl, format);
    }, [coordinates, precision, format, intl]);

    let displayString = "";
    if (coordinatesString) {
        displayString = `${coordinatesString} ${projectionCode}`;
    }

    return (
        <Box {...containerProps}>
            <Text className="coordinate-viewer-text">{displayString}</Text>
        </Box>
    );
};

function useCoordinates(map: MapModel, displayProjectionCode: string | undefined) {
    const [coordinates, setCoordinates] = useState<Coordinate | undefined>();
    const mapProjectionCode = useReactiveSnapshot(() => {
        return map?.projection.getCode() ?? "";
    }, [map]);

    useEffect(() => {
        const eventsKey: EventsKey = map.olMap.on("pointermove", (evt) => {
            setCoordinates(evt.coordinate);
        });
        return () => unByKey(eventsKey);
    }, [map]);

    const finalCoordinates = useMemo(() => {
        if (coordinates && displayProjectionCode) {
            return transformCoordinates(coordinates, mapProjectionCode, displayProjectionCode);
        }
        return coordinates;
    }, [coordinates, mapProjectionCode, displayProjectionCode]);
    const projectionCode = displayProjectionCode ? displayProjectionCode : mapProjectionCode;
    return { coordinates: finalCoordinates, projectionCode };
}

function transformCoordinates(
    coordinates: number[],
    source: string,
    destination: string
): number[] {
    const transformed = transform(coordinates, source, destination);
    return transformed;
}
