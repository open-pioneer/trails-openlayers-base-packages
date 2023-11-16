// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
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
                olLayer: new TileLayer({
                    visible: false
                })
            },
            {
                title: "TopPlus Open Grau",
                olLayer: new TileLayer({
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

it("supports configuring role and aria labels", async () => {
    const { mapId, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    const renderResult = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer
                mapId={mapId}
                role="application"
                /* note: don't mix aria label and aria-labelledby in a real application; this just tests that props are forwarded */
                aria-label="foo"
                aria-labelledby="does-not-exist"
                data-testid="base"
            />
        </PackageContextProvider>
    );

    await waitForMapMount();

    const container = renderResult.container.querySelector(".map-container")!;
    expect(container.role).toBe("application");
    expect(container.getAttribute("aria-label")).toBe("foo");
    expect(container.getAttribute("aria-labelledby")).toEqual("does-not-exist");
});
