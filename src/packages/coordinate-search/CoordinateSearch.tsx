// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModelProps, useMapModel, useProjection } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useService } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import OlMap from "ol/Map";
import { CoordinateInput, CoordsInputEvent } from "./CoordinateInput";
import { AppModel } from "ol-map/AppModel";

/**
 * dropdown items of projection selection with an optional coordinate precision
 */
export interface ProjectionOption {
    /**
     * Label to show
     */
    label: string;

    /**
     * Returns all configured base layers.
     */
    value: string;

    /**
     * Returns all configured base layers.
     */
    precision?: number;
}

/**
 * Event type emitted when the user enters new coordinates or projection is changed by the user.
 */
export interface CoordsSelectEvent {
    /** The entered coordinates in the projection of the map */
    coords: Coordinate;

    /** The current map projection and projection of the coords. */
    projection: string;
}

/**
 * These are special properties for the CoordinateSearch.
 */
export interface CoordinateSearchProps extends CommonComponentProps, MapModelProps {
    /**
     * Searchable projections, only projections that are known by the map as projection are shown.
     * Each projection can have an individual precision of coordinates. If no precision is given, the default precision is used.
     */
    projections?: ProjectionOption[];

    /**
     * Function that gets called if some coordinates are entered or projection is changed by the user.
     */
    onSelect?: (selectProps: CoordsSelectEvent) => void;

    /**
     * Function that gets called if the input is cleared.
     */
    onClear?: () => void;
}

/**
 * The `CoordinateSearch`component can be used in an app to search for entered coordinates in a selected projection
 */
export const CoordinateSearch: FC<CoordinateSearchProps> = (props) => {
    const {
        onSelect,
        onClear,
        projections = [
            {
                label: "WGS 84",
                value: "EPSG:4326",
                precision: 3
            },
            {
                label: "Web Mercator",
                value: "EPSG:3857",
                precision: 2
            }
        ]
    } = props;
    const { containerProps } = useCommonComponentProps("coordinate-search", props);
    const appModel = useService<AppModel>("ol-app.AppModel");
    const { map } = useMapModel(props);
    const olMap = map?.olMap;

    const mapProjectionCode = useProjection(olMap)?.getCode() ?? ""; // projection of the map

    const { coordinates } = useCoordinates(olMap); // coordinates of the pointer in the map

    return (
        <CoordinateInput
            {...containerProps}
            mapId={props.mapId}
            onSelect={(event: CoordsInputEvent) => {
                if (!map) {
                    return;
                }

                olMap?.getView().setCenter(event.coords);

                if (onSelect) {
                    onSelect(event);
                }
            }}
            onClear={() => onClear}
            placeholder={coordinates ? { coords: coordinates, projection: mapProjectionCode } : ""}
            projections={projections}
        />
    );
};

/** function to get the coordinates of the pointer in the map */
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
