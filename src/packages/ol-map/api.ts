// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import "@open-pioneer/runtime";
import type { Resource } from "@open-pioneer/core";
import type OlMap from "ol/Map";
import type { MapOptions } from "ol/Map";
import type { Layer } from "ol/layer";

declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "ol-map.MapRegistry": OlMapRegistry;
        "ol-map.MapConfigProvider": OlMapConfigurationProvider;
        "ol-map.LayerRegistry": OlLayerRegistry;
    }
}

/**
 * Declared a single layer config
 *
 * Use a default uuid, if property `id` is `undefined`
 *
 * Use `false` as default value, if property `isBaseLayer` is `undefined`
 *
 * Use `true` as default value, if property `showInLegend` is `undefined`
 *
 * Use `true` as default value, if property `showInToc` is `undefined`
 */
type OlMapLayer = {
    title: string;
    layer: Layer;
    id?: string;
    description?: string;
    isBaseLayer?: boolean;
    showInLegend?: boolean;
    showInToc?: boolean;
    status: OlMapLayerStatus;
};

/**
 * Declared layer status config
 *
 * Use `undefined` as default status value and change while request layer/service
 *
 * Set code to a HTTP response status codes, if `status === "error"`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
type OlMapLayerStatus = {
    status?: "loading" | "ok" | "error" | "drawing" | "measuring";
    code?: number;
};

/**
 * Provides an ol.Map
 *
 * Get view with OpenLayers function `getView()` from map
 */
export interface OlMapRegistry {
    /**
     * Return map with map id
     *
     * @param mapId
     * @returns {Promise}
     */
    getMap(mapId: string): Promise<OlMap>;

    /**
     * Registers the container for the given map
     *
     * There can only be (at most) one container per map
     *
     * Call `.destroy()` on the returned resource to unregister the `target`
     *
     * @param mapId
     * @param target
     * @returns {Resource}
     */
    setContainer(mapId: string, target: HTMLDivElement): Resource;
}

/**
 * Provides an OpenLayers map configuration with a given map id
 */
export interface OlMapConfigurationProvider {
    /**
     * Identifier of the map.
     */
    readonly mapId: string;

    /**
     * Returns the map options that will be applied on the corresponding map.
     */
    getMapOptions(): Promise<MapOptions>;
}

/**
 * Provides layers of ol.Map
 */
export interface OlLayerRegistry {
    /**
     * Get all configured baseLayer
     *
     * @returns {OlMapLayer[]}
     */
    getBaseLayers(): OlMapLayer[];

    /**
     * Set baseLayer identified by the @param id to visible and all other baseLayers to invisible
     *
     * @param id
     * @returns {Promise}
     */
    setBaseLayer(id: string): Promise<void>;

    /**
     * Create a layer to add to map via `ol.Map` `addLayer()`
     *
     * @param layer
     * @returns {Object}
     */
    createLayer(layer: Object): Object;

    /**
     * Get all operationalLayers
     *
     * @param map
     * @returns {OlMapLayer[]}
     */
    getOperationalLayers(map: OlMap): OlMapLayer[];

    /**
     * Get a layer identified by the @param id
     *
     * @param id
     * @returns {OlMapLayer}
     */
    getLayerById(id: string): OlMapLayer;

    /**
     * Removes a layer from the registry and the map identified by the @param id
     *
     * @param id
     * @returns {Promise}
     */
    removeLayerById(id: string): Promise<void>;

    /**
     * Get specific properties for a layer identified by the @param id via `ol.Layer` `getProperties()`
     *
     * @param id
     * @returns {Object}
     */
    getLayerProperties(id: string): Object;

    /**
     * Set specific property for a layer identified by the @param id via `ol.Layer` `setProperties()`
     *
     * @param id
     * @param key
     * @param value
     * @returns {Promise}
     */
    setLayerProperties(id: string, key: string, value: string): Promise<void>;
}
