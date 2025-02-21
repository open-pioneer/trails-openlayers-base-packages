// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, renderHook } from "@testing-library/react";
import View from "ol/View";
import { expect, it } from "vitest";
import { MapContainer } from "./MapContainer";
import { useCenter, useProjection, useResolution, useScale, useView } from "./hooks";

it("should successfully return the current map view", async () => {
    const map = await renderMap();
    const olMap = map.olMap;

    const initialView = olMap.getView();
    expect(initialView).toBeDefined();

    // change view projection and detect projection change
    const hook = renderHook(() => useView(olMap));
    expect(hook.result.current).toBe(initialView);

    const nextView = new View();
    act(() => {
        olMap.setView(nextView);
    });

    hook.rerender();
    expect(hook.result.current).toBe(nextView);
});

it("should successfully return the map projection", async () => {
    const map = await renderMap();
    const olMap = map.olMap;

    // change view projection and detect projection change
    const hook = renderHook(() => useProjection(olMap));
    const result = hook.result;

    const firstProjection = result.current;
    expect(firstProjection).not.toBe(undefined);

    await act(async () => {
        olMap.setView(
            new View({
                projection: "EPSG:4326",
                // These seem to be required with OpenLayers 8?
                center: olMap.getView().getCenter(),
                resolution: olMap.getView().getResolution()
            })
        );
        olMap.dispatchEvent("change:view");
    });
    hook.rerender();

    const nextProjection = hook.result.current;
    expect(firstProjection).not.toEqual(nextProjection);
});

it("should successfully return the map resolution", async () => {
    const map = await renderMap();
    const olMap = map.olMap;

    const view = olMap.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    const initialZoom = view.getZoom();
    if (!initialZoom) {
        throw new Error("zoom not defined");
    }

    // change zoom level and detect resolution change
    const hook = renderHook(() => useResolution(olMap));
    const result = hook.result;

    const firstResolution = result.current;
    expect(firstResolution).not.toBe(undefined);

    await act(async () => {
        view.setZoom(initialZoom + 1);
    });
    hook.rerender();

    const nextResolution = result.current;
    expect(firstResolution).not.toBe(nextResolution);
});

it("should successfully return the map center", async () => {
    const map = await renderMap();
    const olMap = map.olMap;

    const view = olMap.getView();
    if (!view) {
        throw new Error("view not defined");
    }

    // change center and detect center change
    const hook = renderHook(() => useCenter(olMap));
    const result = hook.result;

    const firstCenter = result.current;
    expect(firstCenter).not.toBe(undefined);

    await act(async () => {
        view.setCenter([1489200, 6894026]);
        view.dispatchEvent("change:center");
    });
    hook.rerender();

    const nextCenter = hook.result.current;
    expect(firstCenter).not.toBe(nextCenter);
    expect(nextCenter).toEqual([1489200, 6894026]);
});

it("should successfully return the map scale", async () => {
    const map = await renderMap();
    const olMap = map.olMap;

    // get map scale
    const hook = renderHook(() => useScale(olMap));
    const result = hook.result;
    expect(result.current).toBe(336409);
});

/**
 * Display the map in the DOM, so hooks can interact with it.
 *
 * Returns the loaded map model for convenience.
 */
async function renderMap() {
    const { map, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer map={map} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    await map.whenDisplayed();
    return map;
}
