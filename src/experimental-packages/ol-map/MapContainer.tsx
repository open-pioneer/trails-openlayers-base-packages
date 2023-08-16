// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import classNames from "classnames";
import type OlMap from "ol/Map";
import { Extent } from "ol/extent";
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
     * Behavior performed by the map when the view padding changes.
     *
     * - `none`: Do nothing.
     * - `preserve-center`: Ensures that the center point remains the same by animating the view.
     * - `preserve-extent`: Ensures that the extent remains the same by zooming.
     *
     * @default "preserve-center"
     */
    viewPaddingChangeBehavior?: "none" | "preserve-center" | "preserve-extent";

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
 * This inner component is rendered when the map has been loaded.
 *
 * It provides the map instance and additional properties down the component tree.
 */
function MapContainerReady(
    props: { map: OlMap } & Omit<MapComponentProps, "mapId" | "className">
): JSX.Element {
    const {
        map,
        viewPadding: viewPaddingProp,
        viewPaddingChangeBehavior = "preserve-center",
        children
    } = props;

    const viewPadding = useMemo<Required<MapPadding>>(() => {
        return {
            left: viewPaddingProp?.left ?? 0,
            right: viewPaddingProp?.right ?? 0,
            top: viewPaddingProp?.top ?? 0,
            bottom: viewPaddingProp?.bottom ?? 0
        };
    }, [viewPaddingProp]);

    // Apply view padding
    useEffect(() => {
        const mapView = map?.getView();
        if (!map || !mapView) {
            return;
        }

        const oldCenter = mapView.getCenter();
        const oldPadding = fromOlPadding(mapView.padding);
        const oldExtent = extentIncludingPadding(map, oldPadding);

        mapView.padding = toOlPadding(viewPadding);
        switch (viewPaddingChangeBehavior) {
            case "preserve-center":
                mapView.animate({ center: oldCenter, duration: 300 });
                break;
            case "preserve-extent": {
                if (oldExtent) {
                    mapView.animate({
                        center: oldCenter,
                        resolution: mapView.getResolutionForExtent(oldExtent),
                        duration: 300
                    });
                }
                break;
            }
            case "none":
        }
    }, [viewPadding, map, viewPaddingChangeBehavior]);

    const mapContext = useMemo((): MapContextType => {
        return {
            map,
            padding: viewPadding
        };
    }, [map, viewPadding]);
    return <MapContextProvider value={mapContext}>{children}</MapContextProvider>;
}

/**
 * Returns the extent visible in the non-padded region of the map.
 */
function extentIncludingPadding(map: OlMap, padding: Required<MapPadding>): Extent | undefined {
    const size = map.getSize();
    if (!size || size.length < 2) {
        return undefined;
    }

    const [width, height] = size as [number, number];
    const bottomLeft = map.getCoordinateFromPixel([padding.left, padding.bottom]);
    const topRight = map.getCoordinateFromPixel([
        Math.max(0, width - padding.right),
        Math.max(0, height - padding.top)
    ]);
    if (!bottomLeft || !topRight) {
        return undefined;
    }

    const [xmin, ymin] = bottomLeft;
    const [xmax, ymax] = topRight;
    return [xmin, ymin, xmax, ymax] as Extent;
}

function fromOlPadding(padding: number[] | undefined): Required<MapPadding> {
    // top, right, bottom, left
    return {
        top: padding?.[0] ?? 0,
        right: padding?.[1] ?? 0,
        bottom: padding?.[2] ?? 0,
        left: padding?.[3] ?? 0
    };
}

function toOlPadding(padding: Required<MapPadding>): number[] {
    // top, right, bottom, left
    const { top, right, bottom, left } = padding;
    return [top, right, bottom, left];
}
