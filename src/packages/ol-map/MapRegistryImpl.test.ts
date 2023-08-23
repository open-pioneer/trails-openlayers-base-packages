// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { getErrorChain } from "@open-pioneer/core";
import { ServiceOptions } from "@open-pioneer/runtime";
import { createService } from "@open-pioneer/test-utils/services";
import { View } from "ol";
import { Attribution } from "ol/control";
import { afterEach, expect, it, vi } from "vitest";
import { MapConfig, MapConfigProvider } from "./api";
import { registerProjections } from "./projections";
import { MapRegistryImpl } from "./services";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = require("resize-observer-polyfill");
const MAP_ID = "test";
class MapProvider implements MapConfigProvider {
    mapId = "default";
    mapConfig: MapConfig = {};

    constructor(options: ServiceOptions) {
        if (options.properties.mapConfig) {
            this.mapConfig = options.properties.mapConfig as MapConfig;
        }
        if (options.properties.mapId) {
            this.mapId = options.properties.mapId as string;
        }
    }

    getMapConfig(): Promise<MapConfig> {
        return Promise.resolve(this.mapConfig);
    }
}

afterEach(() => {
    vi.restoreAllMocks();
});
it("should successfully create and destroy a mapModel", async () => {
    const mapRegistryService = await createMapRegistryService({
        mapConfig: {} as MapConfig,
        mapId: MAP_ID
    });
    const mapModel = await mapRegistryService.expectMapModel(MAP_ID);
    expect(mapModel?.id).toBe(MAP_ID);

    mapRegistryService.destroy();

    await expect(() =>
        mapRegistryService.expectMapModel(MAP_ID)
    ).rejects.toThrowErrorMatchingInlineSnapshot('"MapRegistry has already been destroyed."');
});

it("should successfully set only Attribution when Controls are empty", async () => {
    const mapRegistryService = await createMapRegistryService({
        mapConfig: {} as MapConfig,
        mapId: MAP_ID
    });
    const map = (await mapRegistryService.expectMapModel(MAP_ID))?.olMap;

    const controls = map?.getControls().getArray();
    const attributes = map?.getControls().getArray().at(0);
    expect(controls).toHaveLength(1);
    expect(attributes).toBeInstanceOf(Attribution);
});

it("should log warning message if new View is in advanced configuration and projection is set", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);

    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });

    const mapRegistryService = await createMapRegistryService({
        mapConfig: {
            advanced: {
                view
            },
            projection: "EPSG:25832"
        } as MapConfig,
        mapId: MAP_ID
    });

    await mapRegistryService.expectMapModel(MAP_ID);
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] ol-map:createMapModel: The advanced configuration for map id 'test' has provided a fully constructed view instance: projection cannot be applied.
      Use ViewOptions instead of a View instance.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("should log warning message if new View is in advanced configuration and initialView is set", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);

    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });

    const mapRegistryService = await createMapRegistryService({
        mapConfig: {
            advanced: {
                view
            },
            initialView: {
                kind: "position",
                center: {
                    x: 123,
                    y: 456
                },
                zoom: 5
            }
        } as MapConfig,
        mapId: MAP_ID
    });

    await mapRegistryService.expectMapModel(MAP_ID);
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] ol-map:createMapModel: The advanced configuration for map id 'test' has provided a fully constructed view instance: initialView cannot be applied.
      Use ViewOptions instead of a View instance.",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
});

it("should successfully create View with 'position' property", async () => {
    const mapRegistryService = await createMapRegistryService({
        mapConfig: {
            initialView: {
                kind: "position",
                center: {
                    x: 123,
                    y: 456
                },
                zoom: 5
            }
        } as MapConfig,
        mapId: MAP_ID
    });

    const map = (await mapRegistryService.expectMapModel(MAP_ID))?.olMap;
    const view = map?.getView();

    expect(view?.getCenter()).toContain(123);
    expect(view?.getZoom()).toBe(5);
});

it("should successfully create View with 'extent' property", async () => {
    const extent = {
        xMax: 653028,
        xMin: 5986277,
        yMax: 1674447,
        yMin: 1674447
    };

    const mapRegistryService = await createMapRegistryService({
        mapConfig: {
            initialView: {
                kind: "extent",
                zoom: 5,
                extent
            }
        } as MapConfig,
        mapId: MAP_ID
    });

    const xMin = extent.xMin + (extent.xMax - extent.xMin) / 2;
    const map = (await mapRegistryService.expectMapModel(MAP_ID))?.olMap;
    const view = map?.getView();

    expect(view?.getCenter()).toContain(xMin);
    expect(view?.getZoom()).toBe(0);
});

it("should successfully create View with 'Default' property", async () => {
    const mapRegistryService = await createMapRegistryService({
        mapConfig: {} as MapConfig,
        mapId: MAP_ID
    });

    const map = (await mapRegistryService.expectMapModel(MAP_ID))?.olMap;
    const view = map?.getView();
    expect(view?.getProjection().getCode()).toBe("EPSG:3857");
});

it("should throw an exception by wrong EPSG code", async () => {
    const mapRegistryService = await createMapRegistryService({
        mapConfig: {
            projection: "EPSG:0000000000"
        } as MapConfig,
        mapId: MAP_ID
    });

    let error;
    try {
        await mapRegistryService.expectMapModel(MAP_ID);
        throw new Error("unexpected success");
    } catch (e) {
        error = e as Error;
    }

    const chain = getErrorChain(error);
    const messages = chain.map((error) => error.message);
    expect(messages).toMatchInlineSnapshot(`
      [
        "Failed to construct map 'test'",
        "Failed to retrieve projection for code 'EPSG:0000000000'.",
      ]
    `);
});

it("should successfully create View with 'EPSG:25832'", async () => {
    registerProjections({
        "EPSG:25832":
            "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    });

    const mapRegistryService = await createMapRegistryService({
        mapConfig: {
            initialView: {
                kind: "position",
                center: {
                    x: 123,
                    y: 456
                },
                zoom: 5
            },
            projection: "EPSG:25832"
        } as MapConfig,

        mapId: MAP_ID
    });

    const map = (await mapRegistryService.expectMapModel(MAP_ID))?.olMap;
    const view = map?.getView();
    expect(view?.getProjection().getCode()).toBe("EPSG:25832");
});

async function createMapRegistryService(properties: Record<string, unknown>) {
    const mapConfigProvider = await createService(MapProvider, {
        properties
    });
    const mapRegistryService = await createService(MapRegistryImpl, {
        references: {
            providers: [mapConfigProvider]
        }
    });

    return mapRegistryService;
}
