// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MapContainer } from "./MapContainer";
import {
    setupMap,
    waitForMapMount,
    SimpleMapOptions,
    createTestOlLayer
} from "@open-pioneer/map-test-utils";

afterEach(() => {
    vi.restoreAllMocks();
});

it("successfully creates a map", async () => {
    const { map } = await setupMap();
    const renderResult = render(
        <PackageContextProvider>
            <MapContainer map={map} data-testid="base" />
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // Div is registered as map target
    const container = renderResult.container.querySelector(".map-container");
    expect(container?.tagName).toBe("DIV");
    expect(map?.container).toBe(container);
    expect(map?.olMap.getTarget()).toBe(container);

    // Unmounting removes the container from the map
    renderResult.unmount();
    expect(map?.olMap.getTarget()).toBeUndefined();
    expect(map?.container).toBeUndefined();
});

it("supports configuration of map container root properties", async () => {
    const { map } = await setupMap();
    const renderResult = render(
        <PackageContextProvider>
            <MapContainer
                map={map}
                data-testid="base"
                rootProps={{
                    "data-test": "foo"
                }}
            />
        </PackageContextProvider>
    );
    await waitForMapMount();

    const root = renderResult.container.querySelector(".map-container-root");
    expect(root).toHaveAttribute("data-test", "foo");
});

it("supports configuration of map container properties", async () => {
    const { map } = await setupMap();
    const renderResult = render(
        <PackageContextProvider>
            <MapContainer
                map={map}
                data-testid="base"
                containerProps={{
                    "data-test": "foo"
                }}
            />
        </PackageContextProvider>
    );
    await waitForMapMount();

    const container = renderResult.container.querySelector(".map-container");
    expect(container).toHaveAttribute("data-test", "foo");
});

it("reports an error if two map containers are used for the same map", async () => {
    const logSpy = vi.spyOn(global.console, "error").mockImplementation(() => undefined);
    const { map } = await setupMap();

    render(
        <PackageContextProvider>
            <div data-testid="base">
                <MapContainer map={map} />
                <MapContainer map={map} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction error] {
        "calls": [
          [
            "[ERROR] @open-pioneer/map/ui/MapContainer: Failed to display the map: the map already has a target. There may be more than one <MapContainer />.",
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
    const options = {
        layers: [
            {
                title: "TopPlus Open",
                olLayer: createTestOlLayer()
            },
            {
                title: "TopPlus Open Grau",
                olLayer: createTestOlLayer()
            }
        ]
    } satisfies SimpleMapOptions;
    const { map } = await setupMap(options);

    render(
        <PackageContextProvider>
            <div data-testid="base">
                <MapContainer map={map} />
            </div>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // Div is registered as map target
    const layers = map.layers.getLayers();
    expect(layers[0]?.title).toBe("TopPlus Open");
    expect(layers[1]?.title).toBe("TopPlus Open Grau");
});

it("supports configuring role and aria labels", async () => {
    const { map } = await setupMap();
    const renderResult = render(
        <PackageContextProvider>
            <MapContainer
                map={map}
                role="region"
                /* note: don't mix aria label and aria-labelledby in a real application; this just tests that props are forwarded */
                aria-label="foo"
                aria-labelledby="does-not-exist"
                data-testid="base"
            />
        </PackageContextProvider>
    );

    await waitForMapMount();

    const container = renderResult.container.querySelector(".map-container")!;
    expect(container.role).toBe("region");
    expect(container.getAttribute("aria-label")).toBe("foo");
    expect(container.getAttribute("aria-labelledby")).toEqual("does-not-exist");
});
