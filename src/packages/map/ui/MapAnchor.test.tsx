// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "./MapContainer";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { MapAnchor, MapAnchorPosition, computePositionStyles } from "./MapAnchor";
import { Box, StyleProps } from "@open-pioneer/chakra-integration";
import { PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP } from "./CssProps";

it("should successfully create a map anchor component", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
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
        class="map-anchor css-yv0wkm"
        data-theme="light"
      />
    `);
});

it("should successfully create a map anchor component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
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
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
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
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
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

it("should successfully create a map anchor component with ReactNode as children", async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
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
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
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

it("should successfully create position styles on `top-left` without gap", async () => {
    const position: MapAnchorPosition = "top-left";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computePositionStyles(position);
    expect(styleProps.left).toBe("calc((var(--map-padding-left) + 0px))");
    expect(styleProps.top).toBe("calc((var(--map-padding-top) + 0px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - (var(--map-padding-top) + 0px) - 30px - 0px - 10px)"
    );
    expect(styleProps.maxW).toBe("calc((100%) - (var(--map-padding-left) + 0px) - 0px - 0px)");
});

it("should successfully create position styles on `top-left` with horizontalGap and verticalGap", async () => {
    const position: MapAnchorPosition = "top-left";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computePositionStyles(position, 50, 25);
    expect(styleProps.left).toBe("calc((var(--map-padding-left) + 50px))");
    expect(styleProps.top).toBe("calc((var(--map-padding-top) + 25px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - (var(--map-padding-top) + 25px) - 0px - 25px - 10px)"
    );
    expect(styleProps.maxW).toBe("calc((100%) - (var(--map-padding-left) + 50px) - 0px - 50px)");
});

it("should successfully create position styles on `bottom-right` with horizontalGap and verticalGap", async () => {
    const position: MapAnchorPosition = "bottom-right";
    PADDING_TOP.definition = "10px";
    PADDING_BOTTOM.definition = "10px";
    PADDING_LEFT.definition = "10px";
    PADDING_RIGHT.definition = "10px";

    const styleProps: StyleProps = computePositionStyles(position, 50, 25);
    expect(styleProps.right).toBe("calc((var(--map-padding-right) + 50px))");
    expect(styleProps.bottom).toBe("calc((var(--map-padding-bottom) + 25px))");
    expect(styleProps.maxH).toBe(
        "calc((100%) - 0px - (var(--map-padding-bottom) + 25px) - 25px - 10px)"
    );
    expect(styleProps.maxW).toBe("calc((100%) - 0px - (var(--map-padding-right) + 50px) - 50px)");
});
