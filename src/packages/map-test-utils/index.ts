// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService, HttpServiceRequestInit } from "@open-pioneer/http";
import {
    ExtentConfig,
    InitialViewConfig,
    Layer,
    MapConfig,
    MapConfigProvider,
    MapModel,
    MapRegistry,
    OlMapOptions,
    SimpleLayer,
    SimpleLayerConfig
} from "@open-pioneer/map";
import { createService } from "@open-pioneer/test-utils/services";
import { screen, waitFor } from "@testing-library/react";
import VectorLayer from "ol/layer/Vector";

// Importing internals: needed for test support
import { MapRegistryImpl } from "@open-pioneer/map/services";

export interface SimpleMapOptions {
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
    layers?: (SimpleLayerConfig | Layer)[];

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
        model?.once("changed:initialExtent", () => {
            if (model?.initialExtent) {
                resolve();
            } else {
                reject(new Error("expected a valid extent"));
            }
        });
    });
}

/**
 * Creates a simple map registry service with exactly one map configuration.
 *
 * The map is configured by using the `options` parameter.
 *
 * Returns the map registry and the id of the configured map.
 */
export async function setupMap(options?: SimpleMapOptions) {
    // Always use "test" as mapId for unit tests
    const mapId = "test";

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
        projection: options?.noProjection ? undefined : options?.projection ?? "EPSG:3857",
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

    const registry = await createService(MapRegistryImpl, {
        references: {
            providers: [new MapConfigProviderImpl(mapId, mapConfig)],
            httpService: httpService
        }
    });

    return { mapId, registry };
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

    getMapConfig(): Promise<MapConfig> {
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
}

mockVectorLayer();
