// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, Text } from "@open-pioneer/chakra-integration";
import { useMapModel } from "@open-pioneer/map";
import classNames from "classnames";
import Map from "ol/Map";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { FC, ForwardedRef, RefAttributes, forwardRef, useEffect, useState } from "react";
import { useFormatting, useProjection } from "./hooks";

/**
 * These are special properties for the CoordinateViewer.
 */
export interface CoordinateViewerProps extends BoxProps, RefAttributes<HTMLDivElement> {
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
export const CoordinateViewer: FC<CoordinateViewerProps> = forwardRef(function CoordinateViewer(
    props: CoordinateViewerProps,
    ref: ForwardedRef<HTMLDivElement> | undefined
) {
    const { mapId, className, precision, ...rest } = props;
    const { map } = useMapModel(mapId);
    const olMap = map?.olMap;

    const { coordinates } = useCoordinates(olMap);
    const projectionCode = useProjection(olMap)?.projection?.getCode() ?? "";
    const coordinatesString = useFormatting(coordinates, precision);
    const displayString = coordinatesString ? coordinatesString + " " + projectionCode : "";

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
    }, [map]);

    return { coordinates: coordinates };
}
