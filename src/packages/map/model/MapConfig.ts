// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapOptions as OlMapBaseOptions } from "ol/Map";
import type OlView from "ol/View";
import type { ViewOptions as OlViewOptions } from "ol/View";
import { Layer } from "../layers";

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
 * Advanced options during map construction.
 */
export interface OlMapOptions extends Omit<OlMapBaseOptions, "target" | "view"> {
    /**
     * Advanced options to control the view.
     *
     * We recommend using the `OlViewOptions` type.
     *
     * > Warning: When a fully constructed `OlView` instance is provided, some options
     * > of {@link MapConfig} (such as `initialView` or `projection`) cannot be applied anymore.
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
     * Defaults to `EPSG:3857`.
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
     * are shown _above_ their predecessors.
     *
     * Note: base layers are always shown below all operational layers.
     */
    layers?: Layer[];

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
