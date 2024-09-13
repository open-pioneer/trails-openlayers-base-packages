// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@open-pioneer/chakra-integration";
import { Resource, createLogger } from "@open-pioneer/core";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import type OlMap from "ol/Map";
import { Extent } from "ol/extent";
import { ReactNode, useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { MapModel, MapPadding } from "../api";
import { MapContextProvider, MapContextType } from "./MapContext";
import { useMapModel } from "./useMapModel";
import { PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP } from "./CssProps";
const LOG = createLogger("map:MapContainer");

export interface MapContainerProps extends CommonComponentProps {
    /** The id of the map to display. */
    mapId: string;

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
        mapId,
        viewPadding,
        viewPaddingChangeBehavior,
        children,
        role,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy
    } = props;
    const { containerProps } = useCommonComponentProps("map-container", props);
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapAnchorsHost = useRef<HTMLDivElement>(null);
    const modelState = useMapModel(mapId);
    const mapModel = modelState.map;

    const [ready, setReady] = useState(false);

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
        if (mapContainer.current) {
            const resource = registerMapTarget(mapModel, mapContainer.current);
            return () => resource?.destroy();
        }
    }, [modelState, mapModel, mapId]);

    // Wait for mount to make sure that the map anchors host is available
    useEffect(() => {
        setReady(true);
    }, []);

    const styleProps = useMemo(() => {
        return {
            height: "100%",
            position: "relative",

            // set css variables according to view padding
            [PADDING_TOP.definition]:
                viewPadding?.top != undefined ? viewPadding.top + "px" : "0px",
            [PADDING_BOTTOM.definition]:
                viewPadding?.bottom != undefined ? viewPadding.bottom + "px" : "0px",
            [PADDING_LEFT.definition]:
                viewPadding?.left != undefined ? viewPadding.left + "px" : "0px",
            [PADDING_RIGHT.definition]:
                viewPadding?.right != undefined ? viewPadding.right + "px" : "0px"
        } as CSSProperties;
    }, [viewPadding]);

    return (
        <chakra.div
            {...containerProps}
            role={role}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            ref={mapContainer}
            style={styleProps}
            //eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
        >
            {ready && mapModel && (
                <MapContainerReady
                    map={mapModel.olMap}
                    mapAnchorsHost={mapAnchorsHost.current!}
                    viewPadding={viewPadding}
                    viewPaddingChangeBehavior={viewPaddingChangeBehavior}
                >
                    {children}
                </MapContainerReady>
            )}
            <chakra.div
                ref={mapAnchorsHost}
                className="map-anchors"
                /* note: zero sized, children have a size and are positioned relative to the map-container */
            >
                {/* Map anchors will be mounted here via portal */}
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
    props: { map: OlMap; mapAnchorsHost: HTMLElement } & Omit<
        MapContainerProps,
        "mapId" | "className"
    >
): JSX.Element {
    const {
        map,
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
            mapAnchorsHost
        };
    }, [map, mapAnchorsHost]);
    return <MapContextProvider value={mapContext}>{children}</MapContextProvider>;
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
