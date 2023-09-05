// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, MapRegistry } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";
import { createService } from "@open-pioneer/test-utils/services";
import { MapRegistryImpl } from "@open-pioneer/map/MapRegistryImpl";
import { PackageContextProviderProps } from "@open-pioneer/test-utils/react";
import { screen, waitFor } from "@testing-library/react";

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
                id: "b-1",
                title: "OSM",
                isBaseLayer: true,
                visible: false,
                layer: new TileLayer({
                    source: new OSM()
                })
            },
            {
                id: "b-2",
                title: "Toner",
                isBaseLayer: true,
                visible: true,
                layer: new TileLayer({
                    source: new Stamen({ layer: "toner" })
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
