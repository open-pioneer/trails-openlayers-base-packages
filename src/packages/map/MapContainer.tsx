// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Resource, createLogger } from "@open-pioneer/core";
import classNames from "classnames";
import { useEffect, useRef } from "react";
import { useMapModel } from "./useMapModel";
import { MapModel } from "./api";
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

export interface MapContainerProps {
    /** The id of the map to display. */
    mapId: string;

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
}

/**
 * Displays the map with the given id.
 *
 * There can only be at most one MapContainer for every map.
 */
export function MapContainer(props: MapContainerProps) {
    const { mapId, viewPadding, className } = props;
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

    const mapContainer: React.CSSProperties = {
        height: "100%"
    };
    return (
        <div
            className={classNames("map-container", className)}
            ref={mapElement}
            style={mapContainer}
        />
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
