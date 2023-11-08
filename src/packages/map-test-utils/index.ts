// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    ExtentConfig,
    InitialViewConfig,
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
import { equals as extentEquals } from "ol/extent";
import OlMap from "ol/Map";
import VectorLayer from "ol/layer/Vector";

// Importing internals: needed for test support
import { MapRegistryImpl } from "@open-pioneer/map/services";

export interface SimpleMapOptions {
    center?: { x: number; y: number };
    zoom?: number;
    extent?: ExtentConfig;
    projection?: string;
    layers?: SimpleLayerConfig[];
    advanced?: OlMapOptions;

    noInitialView?: boolean;
    noProjection?: boolean;
}

/**
 * Waits until the open layers map has been mounted in the parent with the given id.
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
        layers: options?.layers?.map((config) => new SimpleLayer(config)) ?? [
            new SimpleLayer({
                title: "OSM",
                olLayer: new VectorLayer()
            })
        ],
        advanced: options?.advanced
    };

    const registry = await createService(MapRegistryImpl, {
        references: {
            providers: [new MapConfigProviderImpl(mapId, mapConfig)]
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

let setupDone = false;

/**
 * Sets up open layers test support.
 *
 * This method should be called from test suites (e.g. in `beforeAll()`) that
 * work with raw OpenLayers maps directly.
 *
 * Note that the map model will automatically call this function during tests.
 */
export function setupOpenLayersTestSupport() {
    if (setupDone) {
        return;
    }

    // Test support: open layers relies on div.offsetHeight (and Width)
    // plus getComputedStyle(div), which do not work as expected in happy dom.
    // The following snippet fakes a size so tests can work with the map.
    OlMap.prototype.updateSize = function () {
        const target = this.getTargetElement();
        const height = 500;
        const width = 500;
        const size = target ? [width, height] : undefined;
        const oldSize = this.getSize();
        if (size && (!oldSize || !extentEquals(size, oldSize))) {
            this.setSize(size);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).updateViewportSize_();
        }
    };
    setupDone = true;
}
