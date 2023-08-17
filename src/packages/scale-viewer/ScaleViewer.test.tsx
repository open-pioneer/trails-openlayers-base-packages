// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapContainer, OlMapConfigurationProvider } from "@open-pioneer/experimental-ol-map";
import { OlMapRegistry } from "@open-pioneer/experimental-ol-map/services";
import { Service, ServiceOptions } from "@open-pioneer/runtime";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MapOptions } from "ol/Map";
import { expect, it } from "vitest";
import { ScaleViewer, useCenter, useResolution, useScale } from "./ScaleViewer";
import View from "ol/View";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";

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

it("should successfully create a scale viewer component", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <ScaleViewer mapId={mapId}></ScaleViewer>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    const div = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const scaleText = domElement.querySelector("p"); // find first HTMLParagraphElement (scale text) in scale viewer component
        if (!scaleText) {
            throw new Error("scale text not rendered");
        }
        return domElement;
    });
    expect(div).toMatchSnapshot();

    // check scale viewer box is available
    const box = container.querySelector(".scale-viewer");
    expect(box).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a scale viewer component with additional css classes and box properties", async () => {
    const mapId = "test";
    const mapOptions = {} as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <ScaleViewer mapId={mapId} className="test test1 test2" pl="1px" />
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    const div = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const scaleText = domElement.querySelector("p"); // find first HTMLParagraphElement (scale text) in scale viewer component
        if (!scaleText) {
            throw new Error("scale text not rendered");
        }
        return domElement;
    });
    expect(div).toMatchSnapshot();

    // check scale viewer box is available
    const box = container.querySelector(".scale-viewer");

    if (!box) {
        throw new Error("scale text not rendered");
    } else {
        expect(box).toBeInstanceOf(HTMLDivElement);
        expect(box.classList.contains("test")).toBe(true);
        expect(box.classList.contains("test1")).toBe(true);
        expect(box.classList.contains("test2")).toBe(true);
        expect(box.classList.contains("test3")).not.toBe(true);

        const styles = window.getComputedStyle(box);
        expect(styles.paddingLeft).toBe("1px");
    }
});

it("should successfully create a map resolution", async () => {
    const mapId = "test";
    const zoom = 10;
    const mapOptions = {
        view: new View({
            projection: "EPSG:3857",
            center: [847541, 6793584],
            zoom
        }),
        layers: [
            new TileLayer({
                source: new OSM(),
                properties: { title: "OSM" }
            })
        ]
    } as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <ScaleViewer mapId={mapId}></ScaleViewer>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const container = domElement.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("map not mounted");
        }
        return domElement;
    });

    const map = await service.getMap(mapId);
    if (!map) {
        throw new Error("map not defined");
    }

    const view = map.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const mapResolution = view.getResolution();
    if (!mapResolution) {
        throw new Error("resolution not defined");
    }

    let mapZoom = view.getZoom();

    // change zoom level and detect resolution change
    const hook = renderHook(() => useResolution(map));
    const result = hook.result;

    const firstResolution = result.current.resolution;
    expect(firstResolution).not.toBe(undefined);

    await act(async () => {
        if (!mapZoom) {
            throw new Error("zoom not defined");
        }

        view.setZoom(++mapZoom);
        view.dispatchEvent("change:resolution");
    });
    hook.rerender();

    const nextResolution = hook.result.current.resolution;
    expect(firstResolution).not.toBe(nextResolution);
});

it("should successfully create a map center", async () => {
    const mapId = "test";
    const zoom = 10;
    const center = [847541, 6793584];
    const mapOptions = {
        view: new View({
            projection: "EPSG:3857",
            center,
            zoom
        }),
        layers: [
            new TileLayer({
                source: new OSM(),
                properties: { title: "OSM" }
            })
        ]
    } as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <ScaleViewer mapId={mapId}></ScaleViewer>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const container = domElement.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("map not mounted");
        }
        return domElement;
    });

    const map = await service.getMap(mapId);
    if (!map) {
        throw new Error("map not defined");
    }

    const view = map.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    // change center and detect center change
    const hook = renderHook(() => useCenter(map));
    const result = hook.result;

    const firstCenter = result.current.center;
    expect(firstCenter).not.toBe(undefined);

    await act(async () => {
        view.setCenter([1489200, 6894026]);
        view.dispatchEvent("change:center");
    });
    hook.rerender();

    const nextCenter = hook.result.current.center;
    expect(firstCenter).not.toBe(nextCenter);
});

it("should successfully create a map scale", async () => {
    const mapId = "test";
    const scale = 336409;
    const zoom = 10;
    const center = [847541, 6793584];
    const mapOptions = {
        view: new View({
            projection: "EPSG:3857",
            center,
            zoom
        }),
        layers: [
            new TileLayer({
                source: new OSM(),
                properties: { title: "OSM" }
            })
        ]
    } as MapOptions;
    const service = await createOlMapRegistry(mapId, mapOptions);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(service)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <ScaleViewer mapId={mapId}></ScaleViewer>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const container = domElement.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("map not mounted");
        }
        return domElement;
    });

    const map = await service.getMap(mapId);
    if (!map) {
        throw new Error("map not defined");
    }

    const view = map.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const mapResolution = view.getResolution();
    if (!mapResolution) {
        throw new Error("resolution not defined");
    }

    const mapCenter = view.getCenter();
    if (!mapCenter) {
        throw new Error("center not defined");
    }

    // get map scale
    const hook = renderHook(() => useScale(map, mapResolution, mapCenter));
    const result = hook.result;
    expect(result.current.scale).toBe(scale);
});
