// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/experimental-ol-map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, renderHook } from "@testing-library/react";
import View from "ol/View";
import { expect, it } from "vitest";
import { useFormatting, useProjection } from "./hooks";
import { createPackageContextProviderProps, setupMap, waitForMapMount } from "./test-utils";

/**
 * @vitest-environment jsdom
 */

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

    const map = await registry.getMap(mapId);
    if (!map) {
        throw new Error("map not defined");
    }

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
