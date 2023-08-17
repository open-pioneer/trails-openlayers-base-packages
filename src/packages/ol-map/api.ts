// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import "@open-pioneer/runtime";
import type { Resource } from "@open-pioneer/core";
import type OlMap from "ol/Map";

declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "ol-map.LayerRegistry": OlLayerRegistry;
        "ol-map.MapRegistry": OlMapRegistry;
    }
}

/**
 * Only provide interface for map and layers
 * Get view with OpenLayers function getView() from map
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
    /**
     * Get all configured baseLayer
     */
    getBaseLayers(): Promise<void>;

    /**
     * Set baseLayer identified by the @param id to visible and all other baseLayers to invisible
     * @param id
     */
    setBaseLayer(id: string): Promise<void>;

    /**
     * Create a layer
     * @param layer
     * @retrun Returns layer configuration to add to map via ol.Map addLayer()
     */
    createLayer(layer: Object): Object;

    /**
     * Get all operationalLayers
     * @param map
     */
    getOperationalLayers(map: OlMap): [];

    /**
     * Get a layer identified by the @param id
     * @param id
     */
    getLayerById(id: string): Object;

    /**
     * Removes a layer from the registry and the map identified by the @param id
     * @param id
     */
    removeLayerById(id: string): Promise<void>;

    /**
     * Get specific properties for a layer identified by the @param id
     * @param id
     */
    getLayerProperties(id: string): Object;

    /**
     * Set specific property for a layer identified by the @param id
     * @param id
     * @param name
     * @param value
     */
    setLayerProperties(id: string, name: string, value: string): Object;
}
