// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { useService } from "open-pioneer:react-hooks";
import { useEffect, useRef } from "react";
import { useAsync } from "react-use";
import classNames from "classnames";
import { MapModelImpl } from "./MapRegistryImpl";
import { createLogger } from "@open-pioneer/core";
const LOG = createLogger("ol-map:MapContainer");

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
    const mapRegistry = useService("ol-map.MapRegistry");
    const modelState = useAsync(async () => await mapRegistry.getMapModel(mapId), [mapId]);
    const mapModel = modelState.value;

    useEffect(() => {
        if (!modelState.loading && !mapModel) {
            LOG.error(`No configuration available for map with id '${mapId}'.`);
        }

        if (mapModel && mapElement.current) {
            const resource = registerMapTarget(mapModel as MapModelImpl, mapElement.current);
            return () => resource.destroy();
        }
    }, [modelState.loading, mapModel, mapId]);

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

function registerMapTarget(mapModel: MapModelImpl, target: HTMLDivElement) {
    const mapId = mapModel.id;
    const olMap = mapModel.olMap;
    if (olMap.getTarget()) {
        throw new Error(`Map with id '${mapId}' already has a target.`);
    }

    LOG.isDebug() && LOG.debug(`Setting target of map '${mapId}':`, target);
    olMap.setTarget(target);
    mapModel.__setContainer(target);

    let unregistered = false;
    return {
        destroy() {
            if (!unregistered) {
                LOG.isDebug() && LOG.debug(`Removing target of map '${mapId}':`, target);
                olMap.setTarget(undefined);
                mapModel.__setContainer(target);
                unregistered = true;
            }
        }
    };
}
