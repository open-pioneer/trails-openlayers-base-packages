// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { MapOptions as OlMapBaseOptions } from "ol/Map";
import type OlView from "ol/View";
import type { ViewOptions as OlViewOptions } from "ol/View";
import type OlBaseLayer from "ol/layer/Base";
import type { Options as WMSSourceOptions } from "ol/source/ImageWMS";
import { LayerModel } from "./layers";

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
 * Options supported by all layer types (operational layers and sublayers).
 */
export interface LayerConfigBase {
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
     * The human-readable description of this layer.
     * Defaults to an empty string.
     */
    description?: string;

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
 * Options supported by all operational layer types.
 */
export interface LayerConfig extends LayerConfigBase {
    /**
     * Whether this layer is a base layer or not.
     * Only one base layer can be active at a time.
     *
     * Defaults to `false`.
     */
    isBaseLayer?: boolean;
}

/**
 * Options to construct a simple layer.
 *
 * Simple layers are wrappers around a custom OpenLayers layer.
 */
export interface SimpleLayerConfig extends LayerConfig {
    /**
     * The raw OpenLayers instance.
     */
    olLayer: OlBaseLayer;
}

/**
 * Options to construct a WMS layer.
 */
export interface WMSLayerConfig extends LayerConfigBase {
    /** URL of the WMS service. */
    url: string;

    /** Configures the layer's sublayers. */
    sublayers?: WMSSublayerConfig[];

    /**
     * Additional source options for the layer's WMS source.
     *
     * NOTE: These options are intended for advanced configuration:
     * the WMS Layer manages some of the open layers source options itself.
     */
    sourceOptions?: Partial<WMSSourceOptions>;
}

/**
 * Options to construct the sublayers of a WMS layer.
 */
export interface WMSSublayerConfig extends LayerConfigBase {
    /** The name of the WMS sublayer in the service's capabilities. */
    name: string;

    /** Configuration for nested sublayers. */
    sublayers?: WMSSublayerConfig[];
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
    layers?: (SimpleLayerConfig | LayerModel)[];

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
