// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { MapAnchor } from "./MapAnchor";
import { MapContainer } from "./MapContainer";

it("should successfully create a map anchor component", async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }

    expect(mapAnchor).toMatchInlineSnapshot(`
      <div
        class="map-anchor css-ufi58a"
      />
    `);
});

it("should successfully create a map anchor component with additional css classes", async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor className="test test1 test2" />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available with additional css classes
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }

    expect(mapAnchor.classList.contains("test")).toBe(true);
    expect(mapAnchor.classList.contains("test1")).toBe(true);
    expect(mapAnchor.classList.contains("test2")).toBe(true);
    expect(mapAnchor.classList.contains("test3")).not.toBe(true);
});

it('should successfully create a map anchor component with prop `position="top-left"`', async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor position="top-left" />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available with style for prop `position`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }
});

it('should successfully create a map anchor component with prop `position="bottom-right"`', async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor position="bottom-right" />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available with style for prop `position`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }
});

it('should successfully create a map anchor component with prop `position="v-center-h-center"`', async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor position="center" />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available with style for prop `position`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }
});

it("should successfully create a map anchor component with ReactNode as children", async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor>
                    <Box className="chakra-ui-box">Chakra UI Box</Box>
                </MapAnchor>
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available with ReactNode as children
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }

    const div = await waitFor(async () => {
        const domElement = mapAnchor.querySelector(".chakra-ui-box");
        if (!domElement) {
            throw new Error("child element in map anchor component not rendered");
        }
        return domElement;
    });

    expect(div.innerHTML).toBe("Chakra UI Box");
});

it("should successfully create multiple map anchor components", async () => {
    const { map, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer map={map} data-testid="base">
                <MapAnchor className="testabc" />
                <MapAnchor className="testdef" />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check multiple map anchor component box are available
    const firstMapAnchor = container.querySelector(".map-anchor.testabc");
    if (!firstMapAnchor) {
        throw new Error("map anchor component with css class `testabc` not rendered");
    }
    expect(firstMapAnchor.tagName).toBe("DIV");

    const secondMapAnchor = container.querySelector(".map-anchor.testdef");
    if (!secondMapAnchor) {
        throw new Error("map anchor component with css class `testdef` not rendered");
    }
    expect(secondMapAnchor.tagName).toBe("DIV");
});
