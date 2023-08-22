// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";
import type OlMap from "ol/Map";
import type OlBaseLayer from "ol/layer/Base";
import type { MapOptions as OlMapBaseOptions } from "ol/Map";
import type OlView from "ol/View";
import type { ViewOptions as OlViewOptions } from "ol/View";

/*
    TODO: 
    - Initialize layer loadState impl
    - Simple helper class for map setup?
*/

export interface MapModelEvents {
    "changed": void;
    "changed:container": void;
    "changed:initialExtent": void;
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

export interface LayerCollectionEvents {
    changed: void;
}

/**
 * Contains the layers known to a {@link MapModel}.
 */
export interface LayerCollection extends EventSource<LayerCollectionEvents> {
    /** The map this collection belongs to. */
    readonly map: MapModel;

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
     *
     * The associated layer is made visible and all other base layers are hidden.
     */
    activateBaseLayer(id: string): void;

    /**
     * Create a new layer model and adds it to the map.
     *
     * The new layer model is automatically registered with this collection.
     */
    createLayer(layer: LayerConfig): LayerModel;

    /**
     * Returns all operational Layers.
     */
    getOperationalLayers(): LayerModel[];

    /**
     * Returns the layer identified by the `id` or undefined, if no such layer exists.
     */
    getLayerById(id: string): LayerModel | undefined;

    /**
     * Returns all layers known to this collection.
     */
    getAllLayers(): LayerModel[];

    /**
     * Removes a layer from the registry and the map identified by the `id`.
     */
    removeLayerById(id: string): void;

    /**
     * Given a raw OpenLayers layer instance, returns the associated {@link LayerModel} - or undefined
     * if the layer is unknown to this collection.
     */
    getLayerByRawInstance(layer: OlBaseLayer): LayerModel | undefined;
}

export interface LayerModelEvents {
    "changed": void;
    "changed:title": void;
    "changed:description": void;
    "changed:attributes": void;
    "changed:loadState": void;
    "changed:loadError": void;
}

export type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/** Represents a layer in the map. */
export interface LayerModel extends EventSource<LayerModelEvents> {
    /** The map this layer belongs to. */
    readonly map: MapModel;

    /** The unique id of this layer (scoped to the owning map). */
    readonly id: string;

    /** The human readable title of this layer. */
    readonly title: string;

    /** The raw OpenLayers layer. */
    readonly olLayer: OlBaseLayer;

    /** The human readable description of this layer. May be empty. */
    readonly description: string;

    /**
     * True if this layer is a base layer.
     *
     * Only one base layer can be visible at a time.
     */
    readonly isBaseLayer: boolean;

    /**
     * Additional attributes associated with this layer.
     */
    readonly attributes: Readonly<Record<string | symbol, unknown>>;

    /**
     * Whether the map has been loaded, or whether an error occurred while trying to load it.
     */
    readonly loadState: LayerLoadState;

    /**
     * The error (if any) that occurred while loading the map.
     *
     * This value is always present if {@link loadState} is `"error"`.
     */
    readonly loadError: Error | undefined;

    /**
     * Updates the title of this layer.
     */
    setTitle(newTitle: string): void;

    /**
     * Updates the description of this layer.
     */
    setDescription(newDescription: string): void;

    /**
     * Updates the attributes of this layer.
     * Values in `newAttributes` are merged into the existing ones (i.e. via `Object.assign`).
     */
    updateAttributes(newAttributes: Record<string | symbol, unknown>): void;
}

/**
 * Provides access to registered map instances.
 *
 * Maps are identified by a unique id.
 *
 * Inject an instance of this service by referencing the interface name `"ol-map.MapRegistry"`.
 */
export interface MapRegistry {
    /**
     * Returns the map model associated with the given id.
     * Returns undefined if there is no such model.
     */
    getMapModel(mapId: string): Promise<MapModel | undefined>;

    /**
     * Returns the OpenLayers map associated with the given id.
     * Returns undefined if there is no such map.
     *
     * This is equivalent to:
     *
     * ```js
     * const model = await mapRegistry.getMapModel(id);
     * const olMap = model?.olMap;
     * ```
     */
    getOlMap(mapId: string): Promise<OlMap | undefined>;
}

/**
 * Configures an extent.
 *
 * Coordinates must be valid for the map's configured projection.
 */
export interface ExtentConfig {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

/**
 * Configures a coordinate.
 *
 * Coordinates must be valid for the map's configured projection.
 */
export interface CoordinateConfig {
    x: number;
    y: number;
    z?: number;
}

/**
 * Configures the map's initial extent.
 */
export interface InitialExtentConfig {
    kind: "extent";
    extent: ExtentConfig;
}

/**
 * Configures the map's initial position.
 */
export interface InitialPositionConfig {
    kind: "position";
    center: CoordinateConfig;
    zoom: number;
}

/**
 * Configures the map's initial view.
 */
export type InitialViewConfig = InitialExtentConfig | InitialPositionConfig;

/**
 * Configures a single layer.
 */
export interface LayerConfig {
    /**
     * The unique id of this layer.
     * Defaults to a generated id.
     */
    id?: string;

    /**
     * The human readable title of this layer.
     */
    title: string;

    /**
     * The raw OpenLayers instance.
     */
    layer: OlBaseLayer;

    /**
     * The human readable description of this layer.
     * Defaults to an empty string.
     */
    description?: string;

    /**
     * Whether this layer is a base layer or not.
     * Only one base layer can be active at a time.
     *
     * Defaults to `false`.
     */
    isBaseLayer?: boolean;

    /**
     * Additional attributes for this layer.
     * These can be arbitrary values.
     */
    attributes?: Record<string | symbol, unknown>;
}

/**
 * Advanced options during map construction.
 */
export interface OlMapOptions extends Omit<OlMapBaseOptions, "target" | "view"> {
    /**
     * Advanced option to control the view.
     *
     * We recommend using the `OlViewOptions` type.
     *
     * > Warning: When a fully constructed `OlView` instance is provided, some options
     * > (such as `initialView` or `projection`) cannot be applied anymore.
     */
    view: OlView | OlViewOptions | Promise<OlViewOptions> | undefined;
}

/**
 * Options supported during map construction.
 */
export interface MapConfig {
    /**
     * Configures the initial view.
     * This can be an extent, or a (center, zoom) value.
     */
    initialView?: InitialViewConfig;

    /**
     * Configures a specific projection, e.g. `"EPSG:4326"`.
     */
    // NOTE: This weird syntax supports better autocomplete for the predefined values.
    // See also https://github.com/microsoft/TypeScript/issues/29729
    projection?: "EPSG:3857" | "EPSG:4326" | (string & {});

    /**
     * Configures the layers of the map.
     */
    layers?: LayerConfig[];

    /**
     * Advanced OpenLayers configuration.
     *
     * Options in this object are passed to the OlMap's constructor.
     * Other properties defined in this configuration (e.g. {@link initialView})
     * will be applied on top of these map options.
     *
     * > Warning: not all properties here are supported.
     * > For example, you cannot set the `target` because the target is controlled by the `<MapContainer />`.
     */
    advanced?: Partial<OlMapOptions>;
}

/**
 * Provides an OpenLayers map configuration with a given map id.
 *
 * The implementor must also provide the interface name `"ol-map.MapConfigProvider"`.
 */
export interface MapConfigProvider {
    /**
     * Unique identifier of the map.
     */
    readonly mapId: string;

    /**
     * Returns the map configuration for this map.
     *
     * Called by the {@link MapRegistry} when the map is requested for the first time.
     *
     * See {@link MapConfig} for supported options.
     */
    getMapConfig(): Promise<MapConfig>;
}

import "@open-pioneer/runtime";
declare module "@open-pioneer/runtime" {
    interface ServiceRegistry {
        "ol-map.MapRegistry": MapRegistry;
        "ol-map.MapConfigProvider": MapConfigProvider;
    }
}
