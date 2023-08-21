// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { OlMapConfigurationProvider } from "@open-pioneer/experimental-ol-map";
import { OlMapRegistry } from "@open-pioneer/experimental-ol-map/services";
import { ServiceOptions } from "@open-pioneer/runtime";
import { PackageContextProviderProps } from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { waitFor, screen } from "@testing-library/react";
import { MapOptions } from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

export interface SimpleMapOptions {
    center?: [number, number];
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
    const mapOptions: MapOptions = {
        view: new View({
            projection: "EPSG:3857",
            center: options?.center ?? [847541, 6793584],
            zoom: options?.zoom ?? 10
        }),
        layers: [
            new TileLayer({
                source: new OSM(),
                properties: { title: "OSM" }
            })
        ]
    };

    const mapConfigProvider = await createService(MapConfigProvider, {
        properties: {
            mapOptions: mapOptions,
            mapId: MAP_ID
        }
    });
    const registry = await createService(OlMapRegistry, {
        references: {
            providers: [mapConfigProvider]
        }
    });

    return { mapId: MAP_ID, registry };
}

export function createPackageContextProviderProps(
    service: OlMapRegistry
): PackageContextProviderProps {
    return {
        services: {
            "ol-map.MapRegistry": service
        }
    };
}

class MapConfigProvider implements OlMapConfigurationProvider {
    mapId = "default";
    mapOptions: MapOptions = {};

    constructor(options: ServiceOptions) {
        if (options.properties.mapOptions) {
            this.mapOptions = options.properties.mapOptions as MapOptions;
        }
        if (options.properties.mapId) {
            this.mapId = options.properties.mapId as string;
        }
    }

    getMapOptions(): Promise<MapOptions> {
        return Promise.resolve(this.mapOptions);
    }
}
