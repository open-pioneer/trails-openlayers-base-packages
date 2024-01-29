// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "./MapContainer";
import { MapPadding } from "../api";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import {
    MapAnchor,
    MapAnchorPosition,
    computeAttributionGap,
    computePositionStyles
} from "./MapAnchor";
import { Box, StyleProps } from "@open-pioneer/chakra-integration";

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
        class="map-anchor css-3czzey"
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

    const styles = window.getComputedStyle(mapAnchor);
    expect(styles.top).toBe("0px");
    expect(styles.left).toBe("0px");
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

    const styles = window.getComputedStyle(mapAnchor);
    expect(styles.right).toBe("0px");

    const attribution = computeAttributionGap();
    expect(styles.bottom).toBe(attribution.gap + "px");
});

it('should successfully create a map anchor component with props `position="bottom-right"` and `horizontalGap={30} verticalGap={10}`', async () => {
    const { mapId, registry } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    const { container } = render(
        <PackageContextProvider services={injectedServices}>
            <MapContainer mapId={mapId} data-testid="base">
                <MapAnchor position="bottom-right" horizontalGap={30} verticalGap={10} />
            </MapContainer>
        </PackageContextProvider>
    );

    // Assert map is mounted
    await waitForMapMount();

    // check map anchor component box is available with style for props `position`, `horizontalGap` and `verticalGap`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    }

    const styles = window.getComputedStyle(mapAnchor);
    expect(styles.right).toBe("30px");
    expect(styles.bottom).toBe("10px");
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
    const padding: Required<MapPadding> = {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
    };

    const styleProps: StyleProps = computePositionStyles(position, padding);
    expect(styleProps.left).toBe("10px");
    expect(styleProps.top).toBe("10px");
    expect(styleProps.maxH).toBe("calc((100%) - 10px - 30px - 0px - 10px)");
    expect(styleProps.maxW).toBe("calc((100%) - 10px - 0px - 0px)");
});

it("should successfully create position styles on `top-left` with horizontalGap and verticalGap", async () => {
    const position: MapAnchorPosition = "top-left";
    const padding: Required<MapPadding> = {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
    };

    const styleProps: StyleProps = computePositionStyles(position, padding, 50, 25);
    expect(styleProps.left).toBe("60px");
    expect(styleProps.top).toBe("35px");
    expect(styleProps.maxH).toBe("calc((100%) - 35px - 0px - 25px - 10px)");
    expect(styleProps.maxW).toBe("calc((100%) - 60px - 0px - 50px)");
});

it("should successfully create position styles on `bottom-right` with horizontalGap and verticalGap", async () => {
    const position: MapAnchorPosition = "bottom-right";
    const padding: Required<MapPadding> = {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
    };

    const styleProps: StyleProps = computePositionStyles(position, padding, 50, 25);
    expect(styleProps.right).toBe("60px");
    expect(styleProps.bottom).toBe("35px");
    expect(styleProps.maxH).toBe("calc((100%) - 0px - 35px - 25px - 10px)");
    expect(styleProps.maxW).toBe("calc((100%) - 0px - 60px - 50px)");
});
