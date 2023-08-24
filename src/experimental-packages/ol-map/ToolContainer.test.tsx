// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { OlMapConfigurationProvider } from "./api";
import { MapContainer } from "./MapContainer";
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
import { ToolContainer } from "./ToolContainer";
import { Box } from "@open-pioneer/chakra-integration";

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

// TODO
// zwei gleichzeitig einbinden
// maxH maxW -> import computePositionStyles
