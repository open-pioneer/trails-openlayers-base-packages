// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Resource, createLogger } from "@open-pioneer/core";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import type OlMap from "ol/Map";
import { Extent } from "ol/extent";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useMapModel } from "./useMapModel";
import { MapModel } from "./api";
import { MapContextProvider, MapContextType } from "./MapContext";
const LOG = createLogger("map:MapContainer");

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

export interface MapContainerProps extends CommonComponentProps {
    /** The id of the map to display. */
    mapId: string;

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

    children?: ReactNode;
}

/**
 * Displays the map with the given id.
 *
 * There can only be at most one MapContainer for every map.
 */
export function MapContainer(props: MapContainerProps) {
    const { mapId, viewPadding, viewPaddingChangeBehavior, children } = props;
    const { containerProps } = useCommonComponentProps("map-container", props);
    const mapElement = useRef<HTMLDivElement>(null);
    const modelState = useMapModel(mapId);
    const mapModel = modelState.map;

    useEffect(() => {
        if (modelState.kind === "loading") {
            return;
        }

        if (modelState.kind === "rejected") {
            LOG.error(`Cannot display the map. Caused by `, modelState.error);
            return;
        }

        if (!mapModel) {
            LOG.error(`No configuration available for map with id '${mapId}'.`);
            return;
        }

        // Mount the map into the DOM
        if (mapElement.current) {
            const resource = registerMapTarget(mapModel, mapElement.current);
            return () => resource?.destroy();
        }
    }, [modelState, mapModel, mapId]);

    useEffect(() => {
        const mapView = mapModel?.olMap.getView();
        if (viewPadding && mapView) {
            const center = mapView.getCenter();
            const { top = 0, right = 0, bottom = 0, left = 0 } = viewPadding;
            mapView.padding = [top, right, bottom, left];
            mapView.animate({ center, duration: 300 });
        }
    }, [viewPadding, mapModel]);

    const mapContainerStyle: React.CSSProperties = {
        height: "100%"
    };
    return (
        <div
            {...containerProps}
            ref={mapElement}
            style={mapContainerStyle}
            //eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
        >
            {mapModel && (
                <MapContainerReady
                    map={mapModel.olMap}
                    viewPadding={viewPadding}
                    viewPaddingChangeBehavior={viewPaddingChangeBehavior}
                >
                    {children}
                </MapContainerReady>
            )}
        </div>
    );
}

function registerMapTarget(mapModel: MapModel, target: HTMLDivElement): Resource | undefined {
    const mapId = mapModel.id;
    const olMap = mapModel.olMap;
    if (olMap.getTarget()) {
        LOG.error(
            `Failed to display the map: the map already has a target. There may be more than one <MapContainer />.`
        );
        return undefined;
    }

    LOG.isDebug() && LOG.debug(`Setting target of map '${mapId}':`, target);
    olMap.setTarget(target);

    let unregistered = false;
    return {
        destroy() {
            if (!unregistered) {
                LOG.isDebug() && LOG.debug(`Removing target of map '${mapId}':`, target);
                olMap.setTarget(undefined);
                unregistered = true;
            }
        }
    };
}

/**
 * This inner component is rendered when the map has been loaded.
 *
 * It provides the map instance and additional properties down the component tree.
 */
function MapContainerReady(
    props: { map: OlMap } & Omit<MapContainerProps, "mapId" | "className">
): JSX.Element {
    const {
        map,
        viewPadding: viewPaddingProp,
        viewPaddingChangeBehavior = "preserve-center",
        children
    } = props;

    const mapAnchorsHost = useMapAnchorsHost(map);

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
            mapAnchorsHost,
            padding: viewPadding
        };
    }, [map, viewPadding, mapAnchorsHost]);
    return <MapContextProvider value={mapContext}>{children}</MapContextProvider>;
}

/**
 * Creates a div to host the map anchors and mounts it as the first child
 * of the map's overlay container.
 *
 * The purpose of this wrapper div is only to ensure the correct tab order:
 * the map anchors should be focussed before the builtin attribution widget.
 */
function useMapAnchorsHost(olMap: OlMap): HTMLDivElement {
    const div = useRef<HTMLDivElement>();
    if (!div.current) {
        div.current = document.createElement("div");
        div.current.classList.add("map-anchors");
    }

    useEffect(() => {
        const child = div.current!;
        const overlayContainer = olMap.getOverlayContainerStopEvent();
        overlayContainer.insertBefore(child, overlayContainer.firstChild);
        return () => child.remove();
    }, [olMap]);

    return div.current;
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
