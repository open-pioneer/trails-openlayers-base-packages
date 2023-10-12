// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";
import type OlMap from "ol/Map";
import type { MapOptions as OlMapBaseOptions } from "ol/Map";
import type OlView from "ol/View";
import type { ViewOptions as OlViewOptions } from "ol/View";
import type OlBaseLayer from "ol/layer/Base";

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

export interface LayerCollectionEvents {
    changed: void;
}

export interface LayerRetrievalOptions {
    /**
     * If set to `true`, layers will be ordered by their display order:
     * Layers listed first in the returned array are shown _below_ layers listed at a later index.
     *
     * By default, layers are returned in arbitrary order.
     */
    sortByDisplayOrder?: boolean;
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
    createLayer(layer: LayerConfig): LayerModel;

    /**
     * Returns all operational layers.
     */
    getOperationalLayers(options?: LayerRetrievalOptions): LayerModel[];

    /**
     * Returns the layer identified by the `id` or undefined, if no such layer exists.
     */
    getLayerById(id: string): LayerModel | undefined;

    /**
     * Returns all layers known to this collection.
     */
    getAllLayers(options?: LayerRetrievalOptions): LayerModel[];

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
    "changed:visible": void;
    "changed:attributes": void;
    "changed:loadState": void;
    "destroy": void;
}

export type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/** Represents a layer in the map. */
export interface LayerModel extends EventSource<LayerModelEvents> {
    /** The map this layer belongs to. */
    readonly map: MapModel;

    /** The unique id of this layer (scoped to the owning map). */
    readonly id: string;

    /** The raw OpenLayers layer. */
    readonly olLayer: OlBaseLayer;

    /** The human-readable title of this layer. */
    readonly title: string;

    /** The human-readable description of this layer. May be empty. */
    readonly description: string;

    /**
     * Whether the layer is visible or not.
     * NOTE: The LayerModel's visible state of the layer might not fit the actual layer's visibility in the map.
     */
    readonly visible: boolean;

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
     * Updates the title of this layer.
     */
    setTitle(newTitle: string): void;

    /**
     * Updates the description of this layer.
     */
    setDescription(newDescription: string): void;

    /**
     * Updates the visibility of this layer to the new value.
     *
     * NOTE: The visibility of base layers cannot be changed through this method.
     * Call {@link LayerCollection.activateBaseLayer} instead.
     */
    setVisible(newVisibility: boolean): void;

    /**
     * Updates the attributes of this layer.
     * Values in `newAttributes` are merged into the existing ones (i.e. via `Object.assign`).
     */
    updateAttributes(newAttributes: Record<string | symbol, unknown>): void;

    /**
     * Deletes the attribute of this layer.
     */
    deleteAttribute(deleteAttribute: string | symbol): void;
}

/**
 * Provides access to registered map instances.
 *
 * Maps are identified by a unique id.
 *
 * Inject an instance of this service by referencing the interface name `"map.MapRegistry"`.
 */
export interface MapRegistry {
    /**
     * Returns the map model associated with the given id.
     * Returns undefined if there is no such model.
     */
    getMapModel(mapId: string): Promise<MapModel | undefined>;

    /**
     * Like {@link getMapModel}, but throws if no configuration exists for the given `mapId`.
     */
    expectMapModel(mapId: string): Promise<MapModel>;

    /**
     * Given a raw OpenLayers map instance, returns the associated {@link MapModel} - or undefined
     * if the map is unknown to this registry.
     *
     * All map models created by this registry (e.g. via {@link MapConfigProvider}) have an associated map model.
     */
    getMapModelByRawInstance(olMap: OlMap): MapModel | undefined;
}

/**
 * Configures an extent.
 *
 * Coordinates must be valid for the map's configured projection.
 */
export interface ExtentConfig {
    xMin: number;
    yMin: number;
    xMax: number;
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
     * The human-readable title of this layer.
     */
    title: string;

    /**
     * The raw OpenLayers instance.
     */
    layer: OlBaseLayer;

    /**
     * The human-readable description of this layer.
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
     * Whether this layer should initially be visible.
     *
     * Defaults to `true`.
     */
    visible?: boolean;

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
     * Advanced options to control the view.
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
     *
     * To use custom projections, make sure that they are registered first:
     *
     * ```ts
     * import { registerProjections } from "@open-pioneer/map";
     *
     * // Usually done at the top of the module.
     * // This will register the projection(s) in proj4's global registry.
     * registerProjections({
     *   "EPSG:31466": "+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=BETA2007.gsb +units=m +no_defs +type=crs",
     *   // ... more projections
     * });
     *
     * // later, use projection: "EPSG:31466"
     * ```
     */
    // NOTE: This weird syntax supports better autocomplete for the predefined values.
    // See also https://github.com/microsoft/TypeScript/issues/29729
    projection?: "EPSG:3857" | "EPSG:4326" | "EPSG:25832" | "EPSG:25833" | (string & {});

    /**
     * Configures the layers of the map.
     *
     * **Layer order**
     *
     * Layers defined in this array are (by default) displayed in their listed order:
     * layers defined first are shown at the bottom, and layers defined at a later position
     * are shown above their predecessors.
     *
     * Note: base layers are always shown below all operational layers.
     */
    layers?: LayerConfig[];

    /**
     * Advanced OpenLayers configuration.
     *
     * Options in this object are passed to the OlMap's constructor.
     * Other properties defined in this configuration (e.g. {@link initialView})
     * will be applied on top of these map options.
     *
     * > Warning: Not all properties here are supported.
     * > For example, you cannot set the `target` because the target is controlled by the `<MapContainer />`.
     */
    advanced?: Partial<OlMapOptions>;
}

/**
 * Provides an OpenLayers map configuration with a given map id.
 *
 * The implementor must also provide the interface name `"map.MapConfigProvider"`.
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
        "map.MapRegistry": MapRegistry;
        "map.MapConfigProvider": MapConfigProvider;
    }
}
