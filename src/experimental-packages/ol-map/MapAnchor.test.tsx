// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { OlMapConfigurationProvider } from "./api";
import { MapContainer, MapPadding } from "./MapContainer";
import { OlMapRegistry } from "./services";
import { Service, ServiceOptions } from "@open-pioneer/runtime";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { render, screen, waitFor } from "@testing-library/react";
import { MapOptions } from "ol/Map";
import { expect, it } from "vitest";
import { MapAnchor, MapAnchorPosition, computePositionStyles } from "./MapAnchor";
import { Box, StyleProps } from "@open-pioneer/chakra-integration";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = require("resize-observer-polyfill");

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

async function createOlMapRegistry(mapId: string, mapOptions: MapOptions) {
    const mapConfigProvider = await createService(MapConfigProvider, {
        properties: {
            mapOptions: mapOptions,
            mapId
        }
    });
    return await createService(OlMapRegistry, {
        references: {
            providers: [mapConfigProvider]
        }
    });
}

function createPackageContextProviderProps(
    service: Service<OlMapRegistry>
): PackageContextProviderProps {
    return {
        services: {
            "ol-map.MapRegistry": service
        }
    };
}

it("should successfully create a map anchor component", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor></MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check map anchor component box is available
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    } else {
        expect(mapAnchor).toBeInstanceOf(HTMLDivElement);
        expect(mapAnchor).toMatchSnapshot();
    }
});

it("should successfully create a map anchor component with additional css classes", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor className="test test1 test2"></MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check map anchor component box is available with additional css classes
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    } else {
        expect(mapAnchor).toBeInstanceOf(HTMLDivElement);
        expect(mapAnchor.classList.contains("test")).toBe(true);
        expect(mapAnchor.classList.contains("test1")).toBe(true);
        expect(mapAnchor.classList.contains("test2")).toBe(true);
        expect(mapAnchor.classList.contains("test3")).not.toBe(true);
    }
});

it('should successfully create a map anchor component with prop `position="top-left"`', async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor position="top-left"></MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check map anchor component box is available with style for prop `position`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    } else {
        const styles = window.getComputedStyle(mapAnchor);
        expect(styles.top).toBe("0px");
        expect(styles.left).toBe("0px");
    }
});

it('should successfully create a map anchor component with prop `position="bottom-right"`', async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor position="bottom-right"></MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check map anchor component box is available with style for prop `position`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    } else {
        const styles = window.getComputedStyle(mapAnchor);
        expect(styles.right).toBe("0px");
        // improvement import / export attributionGap
        expect(styles.bottom).toBe("30px"); // "30px" (attributionGap) if no verticalGap is configured
    }
});

it('should successfully create a map anchor component with props `position="bottom-right"` and `horizontalGap={30} verticalGap={10}`', async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor
                        position="bottom-right"
                        horizontalGap={30}
                        verticalGap={10}
                    ></MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check map anchor component box is available with style for props `position`, `horizontalGap` and `verticalGap`
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    } else {
        const styles = window.getComputedStyle(mapAnchor);
        expect(styles.right).toBe("30px");
        expect(styles.bottom).toBe("10px");
    }
});

it("should successfully create a map anchor component with ReactNode as children", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor>
                        <Box className="chakra-ui-box">Chakra UI Box</Box>
                    </MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check map anchor component box is available with ReactNode as children
    const mapAnchor = container.querySelector(".map-anchor");
    if (!mapAnchor) {
        throw new Error("map anchor component not rendered");
    } else {
        const div = await waitFor(async () => {
            const domElement = mapAnchor.querySelector(".chakra-ui-box");
            if (!domElement) {
                throw new Error("child element in map anchor component not rendered");
            }
            return domElement;
        });

        expect(div.innerHTML).toBe("Chakra UI Box");
    }
});

it("should successfully create multiple map anchor components", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <MapAnchor className="testabc"></MapAnchor>
                    <MapAnchor className="testdef"></MapAnchor>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert map anchor component is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const mapAnchor = domElement.querySelector(".map-anchor");
        if (!mapAnchor) {
            throw new Error("map anchor component not rendered");
        }
        return domElement;
    });

    // check multiple map anchor component box are available
    const firstMapAnchor = container.querySelector(".map-anchor.testabc");
    if (!firstMapAnchor) {
        throw new Error("map anchor component with css class `testabc` not rendered");
    } else {
        expect(firstMapAnchor).toBeInstanceOf(HTMLDivElement);
    }

    const secondMapAnchor = container.querySelector(".map-anchor.testdef");
    if (!secondMapAnchor) {
        throw new Error("map anchor component with css class `testdef` not rendered");
    } else {
        expect(secondMapAnchor).toBeInstanceOf(HTMLDivElement);
    }
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
