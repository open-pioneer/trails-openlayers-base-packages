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
import { ToolContainer, ToolContainerPosition, computePositionStyles } from "./ToolContainer";
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

it("should successfully create a tool container component", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer></ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check tool container box is available
    const toolContainer = container.querySelector(".tool-container");
    if (!toolContainer) {
        throw new Error("tool container not rendered");
    } else {
        expect(toolContainer).toBeInstanceOf(HTMLDivElement);
        expect(toolContainer).toMatchSnapshot();
    }
});

it("should successfully create a tool container component with additional css classes", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer className="test test1 test2"></ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check tool container box is available with additional css classes
    const toolContainer = container.querySelector(".tool-container");
    if (!toolContainer) {
        throw new Error("tool container not rendered");
    } else {
        expect(toolContainer).toBeInstanceOf(HTMLDivElement);
        expect(toolContainer.classList.contains("test")).toBe(true);
        expect(toolContainer.classList.contains("test1")).toBe(true);
        expect(toolContainer.classList.contains("test2")).toBe(true);
        expect(toolContainer.classList.contains("test3")).not.toBe(true);
    }
});

it('should successfully create a tool container component with prop `position="top-left"`', async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer position="top-left"></ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check tool container box is available with style for prop `position`
    const toolContainer = container.querySelector(".tool-container");
    if (!toolContainer) {
        throw new Error("tool container not rendered");
    } else {
        const styles = window.getComputedStyle(toolContainer);
        expect(styles.top).toBe("0px");
        expect(styles.left).toBe("0px");
    }
});

it('should successfully create a tool container component with prop `position="bottom-right"`', async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer position="bottom-right"></ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check tool container box is available with style for prop `position`
    const toolContainer = container.querySelector(".tool-container");
    if (!toolContainer) {
        throw new Error("tool container not rendered");
    } else {
        const styles = window.getComputedStyle(toolContainer);
        expect(styles.right).toBe("0px");
        // improvement import / export attributionGap
        expect(styles.bottom).toBe("30px"); // "30px" (attributionGap) if no verticalGap is configured
    }
});

it('should successfully create a tool container component with props `position="bottom-right"` and `horizontalGap={30} verticalGap={10}`', async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer
                        position="bottom-right"
                        horizontalGap={30}
                        verticalGap={10}
                    ></ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check tool container box is available with style for props `position`, `horizontalGap` and `verticalGap`
    const toolContainer = container.querySelector(".tool-container");
    if (!toolContainer) {
        throw new Error("tool container not rendered");
    } else {
        const styles = window.getComputedStyle(toolContainer);
        expect(styles.right).toBe("30px");
        expect(styles.bottom).toBe("10px");
    }
});

it("should successfully create a tool container component with ReactNode as children", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer>
                        <Box className="chakra-ui-box">Chakra UI Box</Box>
                    </ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check tool container box is available with ReactNode as children
    const toolContainer = container.querySelector(".tool-container");
    if (!toolContainer) {
        throw new Error("tool container not rendered");
    } else {
        const div = await waitFor(async () => {
            const domElement = toolContainer.querySelector(".chakra-ui-box");
            if (!domElement) {
                throw new Error("child element in tool container not rendered");
            }
            return domElement;
        });

        expect(div.innerHTML).toBe("Chakra UI Box");
    }
});

it("should successfully create multiple tool container components", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId}>
                    <ToolContainer className="testabc"></ToolContainer>
                    <ToolContainer className="testdef"></ToolContainer>
                </MapContainer>
            </div>
        </PackageContextProvider>
    );

    // assert tool container is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const toolContainer = domElement.querySelector(".tool-container");
        if (!toolContainer) {
            throw new Error("tool container not rendered");
        }
        return domElement;
    });

    // check multiple tool container box are available
    const firstToolContainer = container.querySelector(".tool-container.testabc");
    if (!firstToolContainer) {
        throw new Error("tool container with css class `testabc` not rendered");
    } else {
        expect(firstToolContainer).toBeInstanceOf(HTMLDivElement);
    }

    const nextToolContainer = container.querySelector(".tool-container.testdef");
    if (!nextToolContainer) {
        throw new Error("tool container with css class `testdef` not rendered");
    } else {
        expect(nextToolContainer).toBeInstanceOf(HTMLDivElement);
    }
});

it("should successfully create position styles on `top-left` without gap", async () => {
    const position: ToolContainerPosition = "top-left";
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
    const position: ToolContainerPosition = "top-left";
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
    const position: ToolContainerPosition = "bottom-right";
    const padding: Required<MapPadding> = {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
    };

    const styleProps: StyleProps = computePositionStyles(position, padding, 50, 25);
    console.log(styleProps);
    expect(styleProps.right).toBe("60px");
    expect(styleProps.bottom).toBe("35px");
    expect(styleProps.maxH).toBe("calc((100%) - 0px - 35px - 25px - 10px)");
    expect(styleProps.maxW).toBe("calc((100%) - 0px - 60px - 50px)");
});

// TODO
// maxH maxW -> import computePositionStyles
