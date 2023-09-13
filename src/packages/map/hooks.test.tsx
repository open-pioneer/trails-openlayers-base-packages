// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment happy-dom
 */
import { MapContainer } from "./MapContainer";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, renderHook } from "@testing-library/react";
import View from "ol/View";
import { get } from "ol/proj";
import { describe, expect, it } from "vitest";
import { createPackageContextProviderProps, setupMap, waitForMapMount } from "./test-utils";
import { useCenter, useProjection, useResolution, useScale, useFormatting } from "./hooks";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
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

describe("hook test for scale viewer ", () => {
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
});

describe("hook test for coordinate viewer ", () => {
    it("should format coordinates to correct coordinate string for the corresponding locale and precision", async () => {
        const coords = [3545.08081, 4543543.009];

        const optionsEN = { locale: "en" };
        const hook = renderHook(() => useFormatting(coords, 2), {
            wrapper: (props) => <PackageContextProvider {...props} {...optionsEN} />
        });
        const stringCoordinates = hook.result.current;
        expect(stringCoordinates).equals("3,545.08 4,543,543.01");

        const optionsDE = { locale: "de" };
        const hookDE = renderHook(() => useFormatting(coords, 3), {
            wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
        });
        expect(hookDE.result.current).equals("3.545,081 4.543.543,009");

        const hookDE_precision0 = renderHook(() => useFormatting(coords, 0), {
            wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
        });
        expect(hookDE_precision0.result.current).equals("3.545 4.543.543");
    });

    it("should format coordinates to correct coordinate string with default precision", async () => {
        const coords = [3545.08081, 4543543.009];
        const optionsDE = { locale: "de" };

        const hookDeWithoutPrecision = renderHook(() => useFormatting(coords, undefined), {
            wrapper: (props) => <PackageContextProvider {...props} {...optionsDE} />
        });
        expect(hookDeWithoutPrecision.result.current).equals("3.545,0808 4.543.543,0090");
    });
});
