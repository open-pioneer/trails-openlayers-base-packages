// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useFormatting, useProjection } from "./hooks";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { expect, it } from "vitest";
import { MapOptions } from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { createService } from "@open-pioneer/test-utils/services";
import { OlMapRegistry } from "@open-pioneer/experimental-ol-map/services";
import { ServiceOptions } from "@open-pioneer/runtime";
import { MapContainer, OlMapConfigurationProvider } from "@open-pioneer/experimental-ol-map";

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

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = require("resize-observer-polyfill");

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

interface SimpleMapOptions {
    center?: [number, number];
    zoom?: number;
}

async function setupMap(options?: SimpleMapOptions) {
    const mapId = "test";
    const mapOptions: MapOptions = {
        view: new View({
            projection: "EPSG:3857",
            center: options?.center ?? [847541, 6793584],
            zoom: options?.zoom ?? 10
        }),
        layers: [
            new TileLayer({
                source: new OSM(),
                properties: { title: "OSM" }
            })
        ]
    };

    const mapConfigProvider = await createService(MapConfigProvider, {
        properties: {
            mapOptions: mapOptions,
            mapId
        }
    });
    const registry = await createService(OlMapRegistry, {
        references: {
            providers: [mapConfigProvider]
        }
    });

    return { mapId, registry };
}

function createPackageContextProviderProps(service: OlMapRegistry): PackageContextProviderProps {
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
