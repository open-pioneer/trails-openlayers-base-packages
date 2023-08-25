// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapConfig, MapConfigProvider, MapRegistry } from "@open-pioneer/map";
import { MapRegistryImpl } from "@open-pioneer/map/services";
import {
    PackageContextProvider,
    PackageContextProviderProps
} from "@open-pioneer/test-utils/react";
import { createService } from "@open-pioneer/test-utils/services";
import { render, screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import ResizeObserver from "resize-observer-polyfill";
import { expect, it } from "vitest";
import { ScaleViewer } from "./ScaleViewer";
// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

it("should successfully create a scale viewer component", async () => {
    const { mapId, registry } = await setupMap();

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
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
    const { mapId, registry } = await setupMap();

    const { container } = render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
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
            "map.MapRegistry": service
        }
    };
}
