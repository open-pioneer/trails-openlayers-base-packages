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

import { ForwardedRef, forwardRef } from "react";

const DEFAULT_PRECISION = 4;

// Todo outsource hooks into hooks.ts (e.g. https://github.com/open-pioneer/trails-openlayers-base-packages/blob/main/src/packages/scale-viewer/hooks.ts)
/**
 * These are special properties for the CoordinateViewer.
 */
interface CoordinateViewerProps {
    /**
     * Number of decimal places shown for coordinates.
     */
    precision?: number;

    /**
     * Additional css class name(s) that will be added tot the CoordinateViewer component.
     */
    className?: string;
}

/**
 * The `CoordinateViewer`component can be used in an app to render the coordinates at the current mouse position.
 */
export const CoordinateViewer = forwardRef(function CoordinateViewer(
    props: OlComponentProps & BoxProps & CoordinateViewerProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, precision, ...rest } = props;
    const { map } = useMap(mapId);

    const { coordinates } = useCoordinates(map);

    const projection = useMemo(() => {
        return getProjection(map);
    }, [map]);

    const coordinatesString = useFormatting(coordinates, precision);
    const displayString = coordinatesString ? coordinatesString + " " + projection : "";

    return (
        <Box className={classNames("coordinate-viewer", className)} ref={ref} {...rest}>
            <Text className="coordinate-viewer-text">{displayString}</Text>
        </Box>
    );
});

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

/**
 * Formats Ol coordinates for displaying it in the UI
 * @param {Coordinate} [coordinates]
 * @param {number | undefined} [configuredPrecision]
 * @return {string} formatted coordinates string
 */
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
