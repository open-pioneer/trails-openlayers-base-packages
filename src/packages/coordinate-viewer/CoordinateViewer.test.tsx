// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { chakra } from "@open-pioneer/chakra-integration";
import { MapContainer, OlMapConfigurationProvider } from "@open-pioneer/experimental-ol-map";
import { OlMapRegistry } from "@open-pioneer/experimental-ol-map/services";
import { Service, ServiceOptions } from "@open-pioneer/runtime";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MapOptions } from "ol/Map";
import BaseEvent from "ol/events/Event";
import { expect, it } from "vitest";
import { CoordinateViewer } from "./CoordinateViewer";
import { setupMap, waitForMapMount } from "./test-utils";
import View from "ol/View";

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

it("should successfully create a coordinate viewer component", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <CoordinateViewer mapId={mapId}></CoordinateViewer>
            </div>
        </PackageContextProvider>
    );

    // coordinate viewer is mounted
    const { viewerDiv } = await waitForCoordinateViewer();
    expect(viewerDiv).toMatchSnapshot();

    // check scale viewer box is available
    expect(viewerDiv).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a coordinate viewer component with additional css classes and box properties", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <CoordinateViewer mapId={mapId} className="test" pl="1px"></CoordinateViewer>
            </div>
        </PackageContextProvider>
    );

    // coordinate viewer is mounted
    const { viewerDiv } = await waitForCoordinateViewer();
    expect(viewerDiv).toMatchSnapshot();

    expect(viewerDiv).toBeInstanceOf(HTMLDivElement);
    expect(viewerDiv.classList.contains("test")).toBe(true);
    expect(viewerDiv.classList.contains("foo")).toBe(false);

    const styles = window.getComputedStyle(viewerDiv);
    expect(styles.paddingLeft).toBe("1px");
});

it("tracks the user's mouse position", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <chakra.div data-testid="map" height="500px" width="500px">
                <MapContainer mapId={mapId} />
            </chakra.div>
            <div data-testid="base">
                <CoordinateViewer mapId={mapId} precision={1} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount("map");
    const { viewerText } = await waitForCoordinateViewer();
    expect(viewerText.textContent).toMatchInlineSnapshot('""');

    const map = await registry.getMap(mapId);
    const simulateMove = (x: number, y: number) => {
        const fakeMoveEvent = new BaseEvent("pointermove");
        (fakeMoveEvent as any).coordinate = [x, y];
        map.dispatchEvent(fakeMoveEvent);
    };

    // Simple move
    act(() => {
        simulateMove(123.4, 567.8);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('"123.4 567.8 EPSG:3857"');

    // Another move + projection change
    act(() => {
        map.setView(
            new View({
                center: [0, 0],
                zoom: 0,
                projection: "EPSG:4326"
            })
        );
        simulateMove(42, 1337);
    });
    expect(viewerText.textContent).toMatchInlineSnapshot('"42.0 1,337.0 EPSG:4326"');
});

async function waitForCoordinateViewer() {
    const { viewerDiv, viewerText } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const viewerDiv = domElement.querySelector(".coordinate-viewer");
        if (!viewerDiv) {
            throw new Error("coordinate viewer not rendered");
        }

        const viewerText = viewerDiv.querySelector(".coordinate-viewer-text");
        if (!viewerText) {
            throw new Error("coordinate viewer text not rendered");
        }
        return { viewerDiv, viewerText };
    });
    return { viewerDiv, viewerText };
}
