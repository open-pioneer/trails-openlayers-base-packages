// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useBasemapLayers } from "./hooks";
import { createPackageContextProviderProps, setupMap, waitForMapMount } from "./test-utils";

/**
 * TODO after merge PR:
 * import { createPackageContextProviderProps, setupMap, waitForMapMount } from "@open-pioneer/map/test-utils";
 *
 * @see https://github.com/open-pioneer/trails-openlayers-base-packages/pull/129
 * @see https://github.com/open-pioneer/trails-openlayers-base-packages/issues/121
 *
 * Delete ./test-utils.ts
 */

it("should successfully get basemap layers", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    const map = await registry.expectMapModel(mapId);
    const layerCollection = map?.layers;

    // get basemap layers
    const hook = renderHook(() => useBasemapLayers("b-1", layerCollection));
    const result = hook.result;

    expect(result.current.baseLayers).not.toBe(undefined);
    expect(result.current.baseLayers?.length).toBe(2);
});
