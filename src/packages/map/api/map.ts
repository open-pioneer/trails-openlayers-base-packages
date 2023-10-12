// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";
import type OlMap from "ol/Map";
import type OlBaseLayer from "ol/layer/Base";
import type { ExtentConfig, SimpleLayerConfig } from "./config";
import type { LayerModel, LayerModelBase } from "./layers";
import type { LayerRetrievalOptions } from "./shared";

/** Events emitted by the {@link MapModel}. */
export interface MapModelEvents {
    "changed": void;
    "changed:container": void;
    "changed:initialExtent": void;
    "destroy": void;
}

/**
 * Represents a map.
 */
export interface MapModel extends EventSource<MapModelEvents> {
    /**
     * The unique id of the map.
     */
    readonly id: string;

    /**
     * The container where the map is currently being rendered.
     *
     * May be undefined if the map is not being rendered at the moment.
     * May change at runtime.
     *
     * The `changed:container` event is emitted when this value changes.
     */
    readonly container: HTMLElement | undefined;

    /**
     * The initial map extent.
     *
     * May be undefined before the map is being shown.
     * This is guaranteed to be initialized if the promise returned by {@link whenDisplayed} has resolved.
     *
     * The `changed:initialExtent` event is emitted when this value changes.
     */
    readonly initialExtent: ExtentConfig | undefined;

    /**
     * Contains all known layers of this map.
     *
     * Note that not all layers in this collection may be active in the OpenLayers map.
     * Also note that not all layers in the OpenLayers map may be contained in this collection.
     */
    readonly layers: LayerCollection;

    /**
     * The raw OpenLayers map.
     */
    readonly olMap: OlMap;

    /**
     * Returns a promise that resolves when the map has mounted in the DOM.
     */
    whenDisplayed(): Promise<void>;
}

/** Events emitted by the {@link LayerCollection}. */
export interface LayerCollectionEvents {
    changed: void;
}

/**
 * Contains the layers known to a {@link MapModel}.
 */
export interface LayerCollection extends EventSource<LayerCollectionEvents> {
    /**
     * Returns all configured base layers.
     */
    getBaseLayers(): LayerModel[];

    /**
     * Returns the currently active base layer.
     */
    getActiveBaseLayer(): LayerModel | undefined;

    /**
     * Activates the base layer with the given id.
     * `undefined` can be used to hide all base layers.
     *
     * The associated layer is made visible and all other base layers are hidden.
     *
     * Returns true if the given layer has been successfully activated.
     */
    activateBaseLayer(id: string | undefined): boolean;

    /**
     * Creates a new layer model and adds it to the map.
     *
     * The new layer model is automatically registered with this collection.
     *
     * NOTE: by default, the new layer will be shown on _top_ of all existing layers.
     */
    addLayer(layer: SimpleLayerConfig | LayerModel): LayerModel;

    /**
     * Returns all operational layers.
     */
    getOperationalLayers(options?: LayerRetrievalOptions): LayerModel[];

    /**
     * Returns the layer identified by the `id` or undefined, if no such layer exists.
     */
    getLayerById(id: string): LayerModelBase | undefined;

    /**
     * Returns all layers known to this collection.
     */
    getAllLayers(options?: LayerRetrievalOptions): LayerModel[];

    /**
     * Removes a layer from the registry and the map identified by the `id`.
     *
     * NOTE: The current implementation only supports removal of _top level_ layers.
     */
    removeLayerById(id: string): void;

    /**
     * Given a raw OpenLayers layer instance, returns the associated {@link LayerModel} - or undefined
     * if the layer is unknown to this collection.
     */
    getLayerByRawInstance(layer: OlBaseLayer): LayerModel | undefined;
}
