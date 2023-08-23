// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapConfig, MapConfigProvider, MapContainer, MapRegistry } from "@open-pioneer/ol-map";
import { MapRegistryImpl } from "@open-pioneer/ol-map/services";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { get } from "ol/proj";
import OSM from "ol/source/OSM";
import ResizeObserver from "resize-observer-polyfill";
import { expect, it } from "vitest";
import { useCenter, useProjection, useResolution, useScale } from "./hooks";
// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

const LOCALE_DE = { locale: "de" };
const LOCALE_EN = { locale: "en" };

it("should successfully create a map projection", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const map = (await registry.expectMapModel(mapId)).olMap;

    // change view projection and detect projection change
    const hook = renderHook(() => useProjection(map));
    const result = hook.result;

    const firstProjection = result.current.projection;
    expect(firstProjection).not.toBe(undefined);

    await act(async () => {
        map.setView(
            new View({
                projection: "EPSG:4326"
            })
        );
        map.dispatchEvent("change:view");
    });
    hook.rerender();

    const nextProjection = hook.result.current.projection;
    expect(firstProjection).not.toEqual(nextProjection);
});

it("should successfully create a map resolution", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const map = (await registry.expectMapModel(mapId)).olMap;

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
    });
    hook.rerender();

    const nextResolution = hook.result.current.resolution;
    expect(firstResolution).not.toBe(nextResolution);
});

it("should successfully create a map center", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const map = (await registry.expectMapModel(mapId)).olMap;

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
    const { registry, mapId } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const map = (await registry.expectMapModel(mapId)).olMap;

    const view = map.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const mapCenter = view.getCenter();
    if (!mapCenter) {
        throw new Error("center not defined");
    }

    const mapResolution = view.getResolution();
    if (!mapResolution) {
        throw new Error("resolution not defined");
    }

    const mapProjection = view.getProjection();
    if (!mapProjection) {
        throw new Error("projection not defined");
    }

    // get map scale
    const hook = renderHook(() => useScale(mapCenter, mapResolution, mapProjection), {
        wrapper: (props) => <PackageContextProvider {...props} {...LOCALE_EN} />
    });
    const result = hook.result;
    expect(result.current.scale).toBe("336,409");
});

it("should successfully create a map scale for the corresponding locale", async () => {
    const center = [847541, 6793584];
    const resolution = 9.554628535647032;
    const projection = get("EPSG:3857");

    const hookEN = renderHook(() => useScale(center, resolution, projection), {
        wrapper: (props) => <PackageContextProvider {...props} {...LOCALE_EN} />
    });
    expect(hookEN.result.current.scale).equals("21,026");

    const hookDE = renderHook(() => useScale(center, resolution, projection), {
        wrapper: (props) => <PackageContextProvider {...props} {...LOCALE_DE} />
    });
    expect(hookDE.result.current.scale).equals("21.026");
});

class MapConfigProviderImpl implements MapConfigProvider {
    mapId = "default";
    mapConfig: MapConfig;

    constructor(mapId: string, mapConfig?: MapConfig | undefined) {
        this.mapId = mapId;
        this.mapConfig = mapConfig ?? {};
    }

    getMapConfig(): Promise<MapConfig> {
        return Promise.resolve(this.mapConfig);
    }
}

export interface SimpleMapOptions {
    center?: { x: number; y: number };
    zoom?: number;
}

async function setupMap(options?: SimpleMapOptions) {
    const mapId = "test";
    const mapConfig: MapConfig = {
        initialView: {
            kind: "position",
            center: options?.center ?? { x: 847541, y: 6793584 },
            zoom: options?.zoom ?? 10
        },
        projection: "EPSG:3857",
        layers: [
            {
                title: "OSM",
                layer: new TileLayer({
                    source: new OSM()
                })
            }
        ]
    };

    const registry = await createService(MapRegistryImpl, {
        references: {
            providers: [new MapConfigProviderImpl(mapId, mapConfig)]
        }
    });

    return { mapId, registry };
}

function createPackageContextProviderProps(service: MapRegistry): PackageContextProviderProps {
    return {
        services: {
            "ol-map.MapRegistry": service
        }
    };
}

async function waitForMapMount() {
    return await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const container = domElement.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("map not mounted");
        }
        return domElement;
    });
}
