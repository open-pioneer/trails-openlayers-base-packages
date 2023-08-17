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
    }
}

/**
 * Declared a single layer config
 *
 * Use a default uuid, if property `id` is `undefined`
 *
 * Use `false` as default value, if property `isBaseLayer` is `undefined`
 */
interface OlLayerOptions {
    title: string;
    layer: Layer;
    id?: string;
    description?: string;
    isBaseLayer?: boolean;
    meta?: Object;
}

interface OlLayerDescriptor {
    title: string;
    layer: Layer;
    id: string;
    description: string;
    isBaseLayer: boolean;
    meta: Object;
}

/**
 * Declared layer status config
 *
 * Set code to a HTTP response status codes, if `status === "error"`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
interface OlLayerStatus {
    msg: string;
    status: "ready" | "loading" | "not-loaded" | "error" | "drawing" | "measuring";
    code?: number;
}

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
    // TODO: make internal
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
     * @returns {OlLayerDescriptor[]}
     */
    getBaseLayers(): OlLayerDescriptor[];

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
    createLayer(layer: OlLayerOptions): Object;

    /**
     * Get all operationalLayers
     *
     * @returns {OlLayerDescriptor[]}
     */
    getOperationalLayers(): OlLayerDescriptor[];

    /**
     * Get a layer identified by the @param id via `ol.Map` `getLayers().getArray()`
     *
     * @param id
     * @returns {OlLayerDescriptor}
     */
    getLayerById(id: string): OlLayerDescriptor;

    /**
     * Removes a layer from the registry and the map identified by the @param id via `ol.Map` `removeLayer()`
     *
     * @param id
     * @returns {Promise}
     */
    removeLayerById(id: string): Promise<void>;

    /**
     * Get properties for a layer identified by the @param id via `ol.Layer` `getProperties()`
     *
     * @param id
     * @returns {Object}
     */
    getLayerProperties(id: string): Object;

    /**
     * Set a specific property for a layer identified by the @param id via `ol.Layer` `setProperties()`
     *
     * @param id
     * @param key
     * @param value
     * @returns {Promise}
     */
    setLayerProperties(id: string, key: string, value: string): Promise<void>;

    /**
     * Get status of a layer identified by the @param id
     *
     * @param id
     * @returns {OlLayerStatus}
     */
    getLayerStatus(id: string): OlLayerStatus;
}
