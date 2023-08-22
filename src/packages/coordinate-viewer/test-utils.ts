// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapRegistryImpl } from "@open-pioneer/ol-map/services";
import { MapConfig, MapConfigProvider, MapRegistry } from "@open-pioneer/ol-map";
import { PackageContextProviderProps } from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

export interface SimpleMapOptions {
    center?: { x: number; y: number };
    zoom?: number;
}

export const MAP_ID = "test";

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

export async function setupMap(options?: SimpleMapOptions) {
    const mapId = "test";
    const mapConfig: MapConfig = {
        initialView: {
            kind: "position",
            center: options?.center ?? { x: 847541, y: 6793584 },
            zoom: options?.zoom ?? 10
        },
        projection: "EPSG:3857",
        layers: [
            {
                title: "OSM",
                layer: new TileLayer({
                    source: new OSM()
                })
            }
        ]
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
            "ol-map.MapRegistry": service
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
