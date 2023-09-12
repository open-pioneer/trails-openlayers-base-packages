// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MapContainer } from "./MapContainer";
import {
    createPackageContextProviderProps,
    setupMap,
    waitForMapMount,
    SimpleMapOptions
} from "./test-utils";
import TileLayer from "ol/layer/Tile";
import Stamen from "ol/source/Stamen";

afterEach(() => {
    vi.restoreAllMocks();
});

it("successfully creates a map", async () => {
    const { mapId, registry } = await setupMap();
    const renderResult = render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // Div is registered as map target
    const map = await registry.expectMapModel(mapId);
    const container = renderResult.container.querySelector(".map-container");
    expect(container).toBeInstanceOf(HTMLDivElement);
    expect(map?.container).toBe(container);
    expect(map?.olMap.getTarget()).toBe(container);

    // Unmounting removes the container from the map
    renderResult.unmount();
    expect(map?.olMap.getTarget()).toBeUndefined();
    expect(map?.container).toBeUndefined();
});

it("reports an error if two map containers are used for the same map", async () => {
    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId); // fully create map before rendering for simplicity

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] map:MapContainer: Failed to display the map: the map already has a target. There may be more than one <MapContainer />.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("successfully creates a map with given configuration", async () => {
    const options: SimpleMapOptions = {
        layers: [
            {
                title: "Watercolor",
                layer: new TileLayer({
                    source: new Stamen({ layer: "watercolor" }),
                    properties: { title: "Watercolor" },
                    visible: false
                })
            },
            {
                title: "Toner",
                layer: new TileLayer({
                    source: new Stamen({ layer: "toner" }),
                    properties: { title: "Toner" },
                    visible: false
                })
            }
        ]
    };
    const { mapId, registry } = await setupMap(options);
    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // Div is registered as map target
    const map = await registry.expectMapModel(mapId);
    const layers = map.layers.getAllLayers();
    expect(layers[0]?.title).toBe("Watercolor");
    expect(layers[1]?.title).toBe("Toner");
});
