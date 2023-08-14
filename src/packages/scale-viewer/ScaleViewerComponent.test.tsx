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
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { MapOptions } from "ol/Map";
import { expect, it } from "vitest";
import { ScaleViewerComponent, useResolution } from "./ScaleViewerComponent";
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
                <ScaleViewerComponent mapId={mapId}></ScaleViewerComponent>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    const div = await waitFor(async () => {
        return await screen.findByTestId("base");
    });
    expect(div).toMatchSnapshot();

    // check scale viewer wrapper is available
    const wrapper = container.querySelector(".scale-viewer-wrapper");
    expect(wrapper).toBeInstanceOf(HTMLDivElement);
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
                <ScaleViewerComponent mapId={mapId}></ScaleViewerComponent>
            </div>
        </PackageContextProvider>
    );

    // assert map and scale viewer is mounted
    const div = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const container = domElement.querySelector(".ol-viewport");
        if (!container) {
            throw new Error("map not mounted");
        }
        return domElement;
    });
    expect(div).toMatchSnapshot();

    const map = await service.getMap(mapId);
    if (!map) {
        throw new Error("map not defined");
    }

    const mapResolution = map.getView().getResolution();
    if (!mapResolution) {
        throw new Error("resolution not defined");
    }

    let mapZoom = map.getView().getZoom();
    if (!mapZoom) {
        throw new Error("zoom not defined");
    }

    // set new zoom level
    expect(mapZoom).toBe(zoom);
    map.getView().setZoom(mapZoom++);
    expect(mapZoom).not.toBe(zoom);

    // trigger moveend event
    map.dispatchEvent("moveend");

    // detect change of resolution
    const { result } = renderHook(() => {
        return useResolution(map);
    });
    expect(result.current.resolution).not.toBe(undefined);
    expect(result.current.resolution).not.toBe(mapResolution);
});
