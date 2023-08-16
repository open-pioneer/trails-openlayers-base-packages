// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import classNames from "classnames";
import type OlMap from "ol/Map";
import { useService } from "open-pioneer:react-hooks";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useAsync } from "react-use";
import { MapContextProvider, MapContextType } from "./MapContext";

export interface OlComponentProps {
    mapId: string;
}

/**
 * Map padding, all values are pixels.
 *
 * See https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#padding
 */
export interface MapPadding {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

export interface MapComponentProps extends OlComponentProps {
    /**
     * Sets the map's padding directly.
     *
     * See: https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#padding)
     */
    viewPadding?: MapPadding | undefined;

    /**
     * Additional class name(s).
     */
    className?: string;

    children?: ReactNode;
}

export function MapContainer(props: MapComponentProps) {
    const { mapId, className, ...rest } = props;

    const mapElement = useRef<HTMLDivElement>(null);
    const mapRegistry = useService("ol-map.MapRegistry");
    const mapState = useAsync(async () => await mapRegistry.getMap(mapId), [mapId]);
    const map = mapState.value; // undefined -> not ready yet

    useEffect(() => {
        if (map && mapElement.current) {
            // Register div as render target
            const resource = mapRegistry.setContainer(mapId, mapElement.current);
            return () => resource.destroy();
        }
    }, [map, mapRegistry, mapId]);

    return (
        <Box className={classNames("map-container", className)} ref={mapElement} h="100%" w="100%">
            {map && <MapContainerReady map={map} {...rest} />}
        </Box>
    );
}

/**
 * This inner component is rendered if the map has been loaded.
 *
 * It provides the map instance and additional properties down the component tree.
 */
function MapContainerReady(
    props: { map: OlMap } & Omit<MapComponentProps, "mapId" | "className">
): JSX.Element {
    const { map, viewPadding: viewPaddingProp, children } = props;
    const viewPadding = useMemo<Required<MapPadding>>(() => {
        return {
            left: viewPaddingProp?.left ?? 0,
            right: viewPaddingProp?.right ?? 0,
            top: viewPaddingProp?.top ?? 0,
            bottom: viewPaddingProp?.bottom ?? 0
        };
    }, [viewPaddingProp]);

    useEffect(() => {
        const mapView = map?.getView();
        if (map && mapView) {
            const center = mapView.getCenter();
            const { top, right, bottom, left } = viewPadding;
            mapView.padding = [top, right, bottom, left];
            mapView.animate({ center, duration: 300 });
        }
    }, [viewPadding, map]);

    const mapContext = useMemo((): MapContextType => {
        return {
            map,
            padding: viewPadding
        };
    }, [map, viewPadding]);

    return <MapContext.Provider value={mapContext}>{children}</MapContext.Provider>;
}
