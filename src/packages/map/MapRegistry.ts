// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { DeclaredService } from "@open-pioneer/runtime";
import type OlMap from "ol/Map";
import type { LayerFactory } from "./LayerFactory";
import type { MapConfig } from "./model/MapConfig";
import type { MapModel } from "./model/MapModel";

/**
 * Provides access to registered map instances.
 *
 * Maps are identified by a unique id.
 *
 * Inject an instance of this service by referencing the interface name `"map.MapRegistry"`.
 */
export interface MapRegistry extends DeclaredService<"map.MapRegistry"> {
    /**
     * Returns the map model associated with the given id.
     * Returns undefined if there is no such model.
     */
    getMapModel(mapId: string): Promise<MapModel | undefined>;

    /**
     * Like {@link getMapModel}, but throws if no model exists for the given `mapId`.
     */
    expectMapModel(mapId: string): Promise<MapModel>;

    /**
     * Given a raw OpenLayers map instance, returns the associated {@link MapModel} - or undefined
     * if the map is unknown to this registry.
     *
     * All OpenLayers maps created by this registry (e.g. via {@link MapConfigProvider} or {@link createMapModel}) have an associated map model.
     */
    getMapModelByRawInstance(olMap: OlMap): MapModel | undefined;

    /**
     * Creates a MapModel without the need to provide a {@link MapConfigProvider}.
     * Throws an error if a map with the given id already exists or if the map config is invalid.
     */
    createMapModel(mapId: string, options?: MapConfig): Promise<MapModel>;
}

/**
 * Options passed to the {@link MapConfigProvider.getMapConfig} method.
 */
export interface MapConfigProviderOptions {
    /**
     * A reference to the layer factory, for the construction of new layer instances.
     */
    layerFactory: LayerFactory;
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
     * See {@link MapConfig} for supported options during map creation.
     * Use {@link MapConfigProviderOptions.layerFactory} to construct new layers.
     */
    getMapConfig(options: MapConfigProviderOptions): Promise<MapConfig>;
}
