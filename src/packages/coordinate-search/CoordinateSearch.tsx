// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { FC, useEffect, useState } from "react";
import { CoordinateInput, CoordinatesSelectEvent, ProjectionInput } from "./CoordinateInput";

/**
 * Properties for the {@link CoordinateSearch}.
 */
export interface CoordinateSearchProps extends CommonComponentProps, MapModelProps {
    /**
     * Searchable projections, only projections that are known by the map as projection are shown.
     * Each projection can have an individual precision of coordinates. If no precision is given, the default precision is used.
     */
    projections?: ProjectionInput[];

    /**
     * Optional event that gets called if some coordinates are entered or projection is changed by the user.
     */
    onSelect?: (event: CoordinatesSelectEvent) => void;

    /**
     * Optional event that gets called if the input is cleared.
     */
    onClear?: () => void;
}

/**
 * The `CoordinateSearch` component can be used in an app to search for entered coordinates in a selected projection
 */
export const CoordinateSearch: FC<CoordinateSearchProps> = (props) => {
    const { onSelect, onClear, projections } = props;
    const { containerProps } = useCommonComponentProps("coordinate-search", props);
    const map = useMapModelValue(props);
    const olMap = map.olMap;

    const { coordinates } = useCoordinates(olMap); // coordinates of the pointer in the map

    return (
        <CoordinateInput
            {...containerProps}
            map={map}
            onSelect={(event: CoordinatesSelectEvent) => {
                olMap.getView().setCenter(event.coords);
                onSelect?.(event);
            }}
            onClear={onClear}
            placeholder={coordinates ? coordinates : ""}
            projections={projections}
        />
    );
};

/* get the current coordinates of the pointer on the map */
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
