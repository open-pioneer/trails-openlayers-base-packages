// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { Resource } from "@open-pioneer/core";
import type OlMap from "ol/Map";

/**
 * Only provide interface for map and layers
 * Get view from Map.GetView()
 */

/**
 * Provide ol.Map
 */
export interface OlMapRegistry {
    /**
     * Return map with map id
     */
    getMap(mapId: string): Promise<OlMap>;

    /**
     * Registers the container for the given map.
     *
     * There can only be (at most) one container per map.
     *
     * Call `.destroy()` on the returned resource to unregister the `target`.
     */
    setContainer(mapId: string, target: HTMLDivElement): Resource;
}

/**
 * Provide layers of ol.Map
 */
export interface OlLayerRegistry {
    getBaseLayers();

    setBaseLayers();

    getOperationalLayers();

    getLayerInfo();

    setLayerInfo();

    getLayerProperties()

    setLayerProperties();

    createLayer();

    removeLayerById();
}
