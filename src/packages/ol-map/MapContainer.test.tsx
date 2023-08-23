// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { ServiceOptions } from "@open-pioneer/runtime";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { render, screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";

import Stamen from "ol/source/Stamen";
import { expect, it } from "vitest";

import { MapConfig, MapConfigProvider } from "./api";
import { MapContainer } from "./MapContainer";
import { MapRegistryImpl } from "./services";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = require("resize-observer-polyfill");

class MapProvider implements MapConfigProvider {
    mapId = "default";
    mapConfig: MapConfig = {};

    constructor(options: ServiceOptions) {
        if (options.properties.mapConfig) {
            this.mapConfig = options.properties.mapConfig as MapConfig;
        }
        if (options.properties.mapId) {
            this.mapId = options.properties.mapId as string;
        }
    }

    getMapConfig(): Promise<MapConfig> {
        return Promise.resolve(this.mapConfig);
    }
}

it("should successfully create a map", async () => {
    const mapConfigProvider = await createService(MapProvider, {
        properties: {
            mapConfig: {} as MapConfig,
            mapId: "test"
        }
    });

    const mapRegistryService = await createService(MapRegistryImpl, {
        references: {
            providers: [mapConfigProvider]
        }
    });

    const mocks: PackageContextProviderProps = {
        services: {
            "ol-map.MapRegistry": mapRegistryService
        }
    };

    const renderResult = render(
        <PackageContextProvider {...mocks}>
            <div data-testid="base">
                <MapContainer mapId="test" />
            </div>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitFor(async () => {
        const div = await screen.findByTestId("base");
        const container = div.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("Map not mounted");
        }
    });

    // Div is registered as map target
    const map = await mapRegistryService.expectMapModel("test");
    const container = renderResult.container.querySelector(".map-container");
    expect(container).toBeInstanceOf(HTMLDivElement);
    expect(map?.container).toBe(container);
    expect(map?.olMap.getTarget()).toBe(container);

    // Unmounting removes the container from the map
    renderResult.unmount();
    expect(map?.olMap.getTarget()).toBeUndefined();
    expect(map?.container).toBeUndefined();
});
//TODO TEST -> should throw an error if the map container is registered twice
it("should successfully create a map with given configuration", async () => {
    const mapConfigProvider = await createService(MapProvider, {
        properties: {
            mapConfig: {
                initialView: {
                    kind: "position",
                    center: {
                        x: 123,
                        y: 456
                    },
                    zoom: 5
                },
                layers: [
                    {
                        title: "testLayer1",
                        layer: new TileLayer({
                            source: new Stamen({ layer: "watercolor" }),
                            properties: { title: "Watercolor" },
                            visible: false
                        })
                    },
                    {
                        title: "testLayer2",
                        layer: new TileLayer({
                            source: new Stamen({ layer: "toner" }),
                            properties: { title: "Toner" },
                            visible: false
                        })
                    }
                ],
                projection: "EPSG:4326"
            } as MapConfig,
            mapId: "test"
        }
    });

    const mapRegistryService = await createService(MapRegistryImpl, {
        references: {
            providers: [mapConfigProvider]
        }
    });

    const map = await mapRegistryService.expectMapModel("test");
    expect(map.olMap.getView().getProjection().getCode()).toBe("EPSG:4326");
    const layers = map.olMap.getAllLayers();
    const layer1 = layers?.at(0);
    const layer2 = layers?.at(1);
    expect(layers?.length).toBe(2);
    expect(layer1?.getProperties().title).toBe("Watercolor");
    expect(layer2?.getProperties().title).toBe("Toner");
});
