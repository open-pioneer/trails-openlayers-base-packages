// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@chakra-ui/react";
import { Resource, createLogger } from "@open-pioneer/core";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import type OlMap from "ol/Map";
import { Extent } from "ol/extent";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { MapModel, MapPadding } from "../api";
import { MapContainerContextProvider, MapContainerContextType } from "./MapContainerContext";
import { MapModelProps, useMapModel } from "./useMapModel";
const LOG = createLogger("map:MapContainer");

export interface MapContainerProps extends CommonComponentProps, MapModelProps {
    /**
     * Sets the map's padding directly.
     * Do not use the view's padding property directly on the OL map.
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

    /**
     * Optional role property.
     *
     * This property is directly applied to the map's container div element.
     */
    role?: string;

    /**
     * Optional aria-labelledby property.
     * Do not use together with aria-label.
     *
     * This property is directly applied to the map's container div element.
     */
    "aria-labelledby"?: string;

    /**
     * Optional aria-label property.
     * Do not use together with aria-label.
     *
     * This property is directly applied to the map's container div element.
     */
    "aria-label"?: string;
}

/**
 * Displays the map with the given id.
 *
 * There can only be at most one MapContainer for every map.
 */
export function MapContainer(props: MapContainerProps) {
    const {
        viewPadding,
        viewPaddingChangeBehavior,
        children,
        role,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy
    } = props;
    const { containerProps } = useCommonComponentProps("map-container-root", props);
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapAnchorsHost = useRef<HTMLDivElement>(null);
    const modelState = useMapModel(props);
    const map = modelState.map;

    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (modelState.kind === "loading") {
            return;
        }

        if (modelState.kind === "rejected") {
            LOG.error(`Cannot display the map. Caused by `, modelState.error);
            return;
        }

        if (!map) {
            LOG.error(`No configuration available for the configured map.`);
            return;
        }

        // Mount the map into the DOM
        if (mapContainer.current) {
            const resource = registerMapTarget(map, mapContainer.current);
            return () => resource?.destroy();
        }
    }, [modelState, map]);

    // Wait for mount to make sure that the map anchors host is available
    useEffect(() => {
        setReady(true);
    }, []);

    const styleProps = useMemo(() => {
        return {
            height: "100%",
            position: "relative",

            // set css variables according to view padding
            "--map-padding-top": `${viewPadding?.top ?? 0}px`,
            "--map-padding-bottom": `${viewPadding?.bottom ?? 0}px`,
            "--map-padding-left": `${viewPadding?.left ?? 0}px`,
            "--map-padding-right": `${viewPadding?.right ?? 0}px`
        };
    }, [viewPadding]);

    return (
        <chakra.div {...containerProps} css={styleProps}>
            {/* Used by open layers to mount the map. This node receives the keyboard focus when interacting with the map. */}
            <chakra.div
                className="map-container"
                ref={mapContainer}
                role={role}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                h="100%"
                w="100%"
                //eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
            />

            {/* Contains user widgets (map anchors and raw children). These are separate from the map so they don't interfere with mouse/keyboard events. */}
            <chakra.div ref={mapAnchorsHost} className="map-anchors">
                {ready && map && (
                    <MapContainerReady
                        olMap={map.olMap}
                        mapAnchorsHost={mapAnchorsHost.current!}
                        viewPadding={viewPadding}
                        viewPaddingChangeBehavior={viewPaddingChangeBehavior}
                    >
                        {children}
                    </MapContainerReady>
                )}
            </chakra.div>
        </chakra.div>
    );
}

/**
 * This inner component is rendered when the map has been loaded.
 *
 * It provides the map instance and additional properties down the component tree.
 */
function MapContainerReady(
    props: { olMap: OlMap; mapAnchorsHost: HTMLElement } & Omit<
        MapContainerProps,
        "mapId" | "map" | "className"
    >
): ReactNode {
    const {
        olMap,
        mapAnchorsHost,
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
        const mapView = olMap?.getView();
        if (!olMap || !mapView) {
            return;
        }

        const oldCenter = mapView.getCenter();
        const oldPadding = fromOlPadding(mapView.padding);
        const oldExtent = extentIncludingPadding(olMap, oldPadding);

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
    }, [viewPadding, olMap, viewPaddingChangeBehavior]);

    const mapContext = useMemo((): MapContainerContextType => {
        return {
            mapAnchorsHost
        };
    }, [mapAnchorsHost]);
    return <MapContainerContextProvider value={mapContext}>{children}</MapContainerContextProvider>;
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
    if (!("keyboardEventTarget_" in olMap)) {
        throw new Error(
            "Internal error: failed to override keyboard event target. The property is no longer present."
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (olMap as any).keyboardEventTarget_ = target;
    olMap.setTarget(target);

    let unregistered = false;
    return {
        destroy() {
            if (!unregistered) {
                LOG.isDebug() && LOG.debug(`Removing target of map '${mapId}':`, target);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (olMap as any).keyboardEventTarget_ = undefined;
                olMap.setTarget(undefined);
                unregistered = true;
            }
        }
    };
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
