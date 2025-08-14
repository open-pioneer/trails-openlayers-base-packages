// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { watch } from "@conterra/reactivity-core";
import { HttpService, HttpServiceRequestInit } from "@open-pioneer/http";
import {
    ExtentConfig,
    InitialViewConfig,
    Layer,
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    MapModel,
    MapRegistry,
    OlMapOptions,
    SimpleLayer,
    SimpleLayerConfig
} from "@open-pioneer/map";
import { MapRegistryImpl } from "@open-pioneer/map/internalTestSupport";
import { LayerFactory } from "@open-pioneer/map/services";
import { createService } from "@open-pioneer/test-utils/services";
import { screen, waitFor } from "@testing-library/react";
import VectorLayer from "ol/layer/Vector";

export type LayerConfig = SimpleLayerConfig | Layer;

export interface SimpleMapOptions {
    /** ID of the map.
     * Defaults to "test". */
    mapId?: string;

    /** Center coordinates for the map. */
    center?: { x: number; y: number };

    /** Zoom level of the map. */
    zoom?: number;

    /**
     * Initial extent (don't mix with center / zoom).
     */
    extent?: ExtentConfig;

    /**
     * The map's projection.
     */
    projection?: string;

    /**
     * Layers used by the map.
     */
    layers?: LayerConfig[];

    /**
     * Overrides fetching of network resources (such as service capabilities).
     */
    fetch?: (resource: URL, init: HttpServiceRequestInit | undefined) => Promise<Response>;

    /**
     * Passed to the open layers map constructor.
     */
    advanced?: OlMapOptions;

    /**
     * Disables the initial view when set to true.
     */
    noInitialView?: boolean;

    /**
     * Disables the default projection when set to true.
     */
    noProjection?: boolean;

    /**
     * Also returns the map object in the return value.
     * True by default.
     *
     * Use `false` to test the async loading behavior of the registry.
     */
    returnMap?: boolean;
}

/**
 * Waits until the OpenLayers map has been mounted in the parent with the given id.
 */
export async function waitForMapMount(parentTestId = "base") {
    return await waitFor(async () => {
        const domElement = await screen.findByTestId(parentTestId);
        const container = domElement.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("map not mounted");
        }
        return domElement;
    });
}

/**
 * Waits until the model has an initial extent.
 */
export async function waitForInitialExtent(model: MapModel) {
    if (model.initialExtent) {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        const resource = watch(
            () => [model.initialExtent],
            ([extent]) => {
                resource.destroy();
                if (extent) {
                    resolve();
                } else {
                    reject(new Error("Expected a valid initial extent"));
                }
            }
        );
    });
}

export interface SetupMapResult {
    mapId: string;
    registry: MapRegistry;
}

/**
 * Creates a simple map registry service with exactly one map configuration.
 *
 * The map is configured by using the `options` parameter.
 * If `options.returnMap` is `true` (the default), the map model is also returned.
 *
 * Returns the map registry and the id of the configured map.
 */
export async function setupMap(
    options?: SimpleMapOptions & { returnMap?: true }
): Promise<SetupMapResult & { map: MapModel }>;
export async function setupMap(options?: SimpleMapOptions): Promise<SetupMapResult>;
export async function setupMap(
    options?: SimpleMapOptions
): Promise<SetupMapResult & { map: MapModel | undefined }> {
    const mapId = options?.mapId ?? "test";

    const getInitialView = (): InitialViewConfig => {
        if (options?.extent) {
            return {
                kind: "extent",
                extent: options.extent
            };
        }
        return {
            kind: "position",
            center: options?.center ?? { x: 847541, y: 6793584 },
            zoom: options?.zoom ?? 10
        };
    };

    const mapConfig: MapConfig = {
        initialView: options?.noInitialView ? undefined : getInitialView(),
        projection: options?.noProjection ? undefined : (options?.projection ?? "EPSG:3857"),
        layers: options?.layers?.map(
            (config) => ("map" in config ? config : new SimpleLayer(config))
            // using map as discriminator (no prototype for Layer)
        ) ?? [
            new SimpleLayer({
                title: "OSM",
                olLayer: new VectorLayer()
            })
        ],
        advanced: options?.advanced
    };

    const httpService = {
        async fetch(resource, init) {
            if (options?.fetch) {
                const url = new URL(resource, "http://localhost:1234");
                return options.fetch(url, init);
            }
            throw new Error(
                "Network requests are not implemented (override fetch via map test utils if your test requires network access)."
            );
        }
    } satisfies Partial<HttpService> as HttpService;

    const layerFactory = await createService(LayerFactory, {
        references: {
            httpService
        }
    });

    const registry = await createService(MapRegistryImpl, {
        references: {
            providers: [new MapConfigProviderImpl(mapId, mapConfig)],
            httpService,
            layerFactory
        }
    });

    let map: MapModel | undefined;
    if (options?.returnMap !== false) {
        map = await registry.expectMapModel(mapId);
    }
    return { mapId, registry, map };
}

/**
 * Creates (service name, service implementation)-pairs suitable for the `services`
 * option of the `PackageContextProvider`.
 *
 * This helper method can be used to avoid hard-coding service names used in the implementation.
 */
export function createServiceOptions(services: { registry: MapRegistry }): Record<string, unknown> {
    return {
        "map.MapRegistry": services.registry
    };
}

class MapConfigProviderImpl implements MapConfigProvider {
    mapId = "default";
    mapConfig: MapConfig;

    constructor(mapId: string, mapConfig?: MapConfig | undefined) {
        this.mapId = mapId;
        this.mapConfig = mapConfig ?? {};
    }

    getMapConfig(options: MapConfigProviderOptions): Promise<MapConfig> {
        if (!options.layerFactory) {
            // TODO: layer factory is currently not used.
            throw new Error("Internal error: map registry should pass a layer factory instance");
        }
        return Promise.resolve(this.mapConfig);
    }
}

function mockVectorLayer() {
    // Overwrite render so it doesn't actually do anything during tests.
    // Would otherwise error because <canvas /> is not fully implemented in happy dom.
    const div = document.createElement("div");
    VectorLayer.prototype.render = () => {
        return div;
    };

    // Needed by tests in editing package
    VectorLayer.prototype.setStyle = () => {};
    VectorLayer.prototype.getStyleFunction = () => () => [];
}

mockVectorLayer();
