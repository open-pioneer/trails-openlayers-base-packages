// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProviderProps } from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import {
    ExtentConfig,
    InitialViewConfig,
    LayerConfig,
    MapConfig,
    MapConfigProvider,
    MapRegistry,
    OlMapOptions
} from "./api";
import { MapRegistryImpl } from "./services";
import { MapModelImpl } from "./model/MapModelImpl";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

export interface SimpleMapOptions {
    center?: { x: number; y: number };
    zoom?: number;
    extent?: ExtentConfig;
    projection?: string;
    layers?: LayerConfig[];
    advanced?: OlMapOptions;

    noInitialView?: boolean;
    noProjection?: boolean;
}

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

export async function waitForInitialExtent(model: MapModelImpl) {
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
        layers: options?.layers ?? [
            {
                title: "OSM",
                layer: new TileLayer({
                    source: new OSM()
                })
            }
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

export function createPackageContextProviderProps(
    service: MapRegistry
): PackageContextProviderProps {
    return {
        services: {
            "map.MapRegistry": service
        }
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
