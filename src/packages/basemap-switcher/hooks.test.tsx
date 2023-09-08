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
import {
    createPackageContextProviderProps,
    setupMap,
    waitForMapMount
} from "@open-pioneer/map/test-utils";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { BkgTopPlusOpen } from "@open-pioneer/map/BkgTopPlusOpen";

const defaultBasemapConfig = [
    {
        id: "b-1",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        layer: new TileLayer({
            source: new OSM()
        })
    },
    {
        id: "b-2",
        title: "TopPlus Open",
        isBaseLayer: true,
        visible: false,
        layer: new TileLayer({
            source: new BkgTopPlusOpen()
        })
    }
];

it("should successfully get basemap layers", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

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
