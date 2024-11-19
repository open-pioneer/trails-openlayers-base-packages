// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { EventSource, Resource } from "@open-pioneer/core";
import type OlMap from "ol/Map";
import type OlView from "ol/View";
import type OlBaseLayer from "ol/layer/Base";
import type { ExtentConfig } from "./MapConfig";
import type { AnyLayer, Layer } from "./layers";
import type { LayerRetrievalOptions } from "./shared";
import type { Geometry } from "ol/geom";
import type { BaseFeature } from "./BaseFeature";
import type { StyleLike } from "ol/style/Style";
import type { Projection } from "ol/proj";
import type { Coordinate } from "ol/coordinate";

/** Events emitted by the {@link MapModel}. */
export interface MapModelEvents {
    "destroy": void;
}

/** Styleoptions supported when creating a new {@link Highlight}. */
export interface HighlightOptions {
    /**
     * Optional styles to override the default styles.
     */
    highlightStyle?: HighlightStyle;
}

/** Zoomoptions supported when creating a new {@link Highlight}. */
export interface ZoomOptions {
    /**
     * The zoom-level used if there is no valid extend (such as for single points).
     */
    pointZoom?: number;

    /**
     * The maximum zoom-level for multiple points, line or polygon results.
     */
    maxZoom?: number;

    /**
     * The view padding to make all features visible.
     */
    viewPadding?: MapPadding;
}

/** Options supported by the map model's {@link MapModel.highlightAndZoom | zoom | highlightAndZoom} method. */
export interface HighlightZoomOptions extends HighlightOptions, ZoomOptions {}

/**
 * Custom styles when creating a new {@link Highlight}.
 */
export type HighlightStyle = {
    Point?: StyleLike;
    LineString?: StyleLike;
    Polygon?: StyleLike;
    MultiPolygon?: StyleLike;
    MultiPoint?: StyleLike;
    MultiLineString?: StyleLike;
};

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

/**
 * Represents the additional graphical representations of objects.
 *
 * See also {@link MapModel.highlight}.
 */
export interface Highlight extends Resource {
    readonly isActive: boolean;
}

/**
 * Represents a Object
 */
export type DisplayTarget = BaseFeature | Geometry;

/**
 * Represents a map.
 */
export interface MapModel extends EventSource<MapModelEvents> {
    /**
     * The unique id of the map.
     */
    readonly id: string;

    /**
     * The container in which the map is currently being rendered.
     *
     * May be undefined if the map is not being rendered at the moment.
     * May change at runtime.
     */
    readonly container: HTMLElement | undefined;

    /**
     * The initial map extent.
     *
     * May be undefined before the map is shown.
     * This is guaranteed to be initialized if the promise returned by {@link whenDisplayed} has resolved.
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
     * Returns the current view of the OpenLayers map.
     */
    readonly olView: OlView;

    /**
     * Returns the current zoom level of the map.
     * Same as `olView.getZoom()`, but reactive.
     */
    readonly zoomLevel: number | undefined;

    /**
     * Returns the current resolution of the map.
     * Same as `olView.getResolution()`, but reactive.
     */
    readonly resolution: number | undefined;

    /**
     * Returns the current center of the map.
     * Same as `olView.getCenter()`, but reactive.
     */
    readonly center: Coordinate | undefined;

    /**
     * Returns the current projection of the map (reactive).
     */
    readonly projection: Projection;

    /**
     * Returns the current scale of the map.
     *
     * Technically, this is the _denominator_ of the current scale.
     * In order to display it, use a format like `1:${scale}`.
     */
    readonly scale: number | undefined;

    /**
     * Changes the current scale of the map to the given value.
     *
     * Internally, this computes a new zoom level / resolution based on the scale
     * and the current center.
     * The new resolution is then applied to the current `olView`.
     *
     * See also {@link scale}.
     */
    setScale(newScale: number): void;

    /**
     * Returns a promise that resolves when the map has mounted in the DOM.
     */
    whenDisplayed(): Promise<void>;

    /**
     * Creates a highlight at the given targets.
     *
     * A highlight is a temporary graphic on the map that calls attention to a point or an area.
     *
     * Call `destroy()` on the returned highlight object to remove the highlight again.
     */
    highlight(geometries: DisplayTarget[], options?: HighlightOptions): Highlight;

    /**
     * Zooms to the given targets.
     */
    zoom(geometries: DisplayTarget[], options?: ZoomOptions): void;

    /**
     * Creates a highlight and zooms to the given targets.
     *
     * See also {@link highlight} and {@link zoom}.
     */
    highlightAndZoom(geometries: DisplayTarget[], options?: HighlightZoomOptions): Highlight;

    /**
     * Removes any existing highlights from the map.
     */
    removeHighlights(): void;
}

/**
 * Contains the layers known to a {@link MapModel}.
 */
export interface LayerCollection {
    /**
     * Returns all configured base layers.
     */
    getBaseLayers(): Layer[];

    /**
     * Returns the currently active base layer.
     */
    getActiveBaseLayer(): Layer | undefined;

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
     * Adds a new layer to the map.
     *
     * The new layer is automatically registered with this collection.
     *
     * NOTE: by default, the new layer will be shown on _top_ of all existing layers.
     */
    addLayer(layer: Layer): void;

    /**
     * Returns all operational layers.
     */
    getOperationalLayers(options?: LayerRetrievalOptions): Layer[];

    /**
     * Returns the layer identified by the `id` or undefined, if no such layer exists.
     */
    getLayerById(id: string): AnyLayer | undefined;

    /**
     * Returns all layers known to this collection.
     */
    getAllLayers(options?: LayerRetrievalOptions): Layer[];

    /**
     * Removes a layer identified by the `id` from the map.
     *
     * NOTE: The current implementation only supports removal of _top level_ layers.
     */
    removeLayerById(id: string): void;

    /**
     * Given a raw OpenLayers layer instance, returns the associated {@link Layer} - or undefined
     * if the layer is unknown to this collection.
     */
    getLayerByRawInstance(olLayer: OlBaseLayer): Layer | undefined;
}
