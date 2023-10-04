// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MapContainer } from "./MapContainer";
import {
    createServiceOptions,
    setupMap,
    waitForMapMount,
    SimpleMapOptions
} from "@open-pioneer/map-test-utils";
import TileLayer from "ol/layer/Tile";

afterEach(() => {
    vi.restoreAllMocks();
});

it("successfully creates a map", async () => {
    const { mapId, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    const renderResult = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base" />
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

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
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
                title: "TopPlus Open",
                layer: new TileLayer({
                    visible: false
                })
            },
            {
                title: "TopPlus Open Grau",
                layer: new TileLayer({
                    visible: false
                })
            }
        ]
    };
    const { mapId, registry } = await setupMap(options);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
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
    expect(layers[0]?.title).toBe("TopPlus Open");
    expect(layers[1]?.title).toBe("TopPlus Open Grau");
});
