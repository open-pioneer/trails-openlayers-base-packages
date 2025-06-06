// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { getErrorChain } from "@open-pioneer/core";
import { View } from "ol";
import { Attribution } from "ol/control";
import { afterEach, expect, it, vi } from "vitest";
import { registerProjections } from "./projections";
import { setupMap, SetupMapResult, SimpleMapOptions } from "@open-pioneer/map-test-utils";
import OlMap from "ol/Map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { defaults as defaultInteraction } from "ol/interaction";
import dragRotate from "ol/interaction/DragRotate";
import { MapRegistryImpl } from "./MapRegistryImpl";

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create and destroy a mapModel", async () => {
    const { mapId, registry } = await createMap();
    const mapModel = await registry.expectMapModel(mapId);
    expect(mapModel?.id).toBe(mapId);

    (registry as MapRegistryImpl).destroy();

    await expect(() => registry.expectMapModel(mapId)).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: MapRegistry has already been destroyed.]`
    );

    await expect(() => mapModel.whenDisplayed()).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Map model was destroyed.]`
    );
});

it("should support reverse lookup from raw OpenLayers map", async () => {
    const { mapId, registry } = await createMap();
    const mapModel = await registry.expectMapModel(mapId);
    const olMap = mapModel.olMap;
    expect(olMap).toBeDefined();

    expect(registry.getMapModelByRawInstance(olMap)).toBe(mapModel);

    const otherMap = new OlMap();
    expect(registry.getMapModelByRawInstance(otherMap)).toBe(undefined);
});

it("should successfully set only attribution when controls are empty", async () => {
    const { mapId, registry } = await createMap();
    const map = (await registry.expectMapModel(mapId))?.olMap;

    const controls = map?.getControls().getArray();
    const attributes = map?.getControls().getArray().at(0);
    expect(controls).toHaveLength(1);
    expect(attributes).toBeInstanceOf(Attribution);
});

it("should log warning message if new View is in advanced configuration and projection is set", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);

    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });
    const { mapId, registry } = await createMap({
        advanced: {
            view
        },
        projection: "EPSG:31466",
        noInitialView: true
    });
    await registry.expectMapModel(mapId);

    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] map:createMapModel: The advanced configuration for map id 'test' has provided a fully constructed view instance: projection cannot be applied.
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

it("should log a warning message if new View is in advanced configuration and initialView is set", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);

    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });
    const { mapId, registry } = await createMap({
        advanced: {
            view
        },
        center: {
            x: 123,
            y: 456
        },
        zoom: 5,
        noProjection: true
    });
    await registry.expectMapModel(mapId);
    expect(logSpy).toMatchInlineSnapshot(`
      [MockFunction warn] {
        "calls": [
          [
            "[WARN] map:createMapModel: The advanced configuration for map id 'test' has provided a fully constructed view instance: initialView cannot be applied.
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

it("should deactivate rotate interaction", async () => {
    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });
    const { mapId, registry } = await createMap({
        advanced: {
            view
        },
        noProjection: true,
        noInitialView: true
    });
    const map = (await registry.expectMapModel(mapId)).olMap;

    const interactions = map?.getInteractions().getArray();
    const activeDragRotate = interactions?.find((interaction) => interaction instanceof dragRotate);

    expect(activeDragRotate).toBeUndefined();
});

it("should not overwrite explicity activated rotation", async () => {
    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });
    const { mapId, registry } = await createMap({
        advanced: {
            view,
            interactions: defaultInteraction({
                altShiftDragRotate: true
            })
        },
        noInitialView: true,
        noProjection: true
    });

    const map = (await registry.expectMapModel(mapId)).olMap;
    const interactions = map?.getInteractions().getArray();
    const activeDragRotate = interactions?.find((interaction) => interaction instanceof dragRotate);

    expect(activeDragRotate).toBeDefined();
    expect(activeDragRotate?.getActive()).toBe(true);
});

it("should successfully create View with 'position' property", async () => {
    const { mapId, registry } = await createMap({
        center: {
            x: 123,
            y: 456
        },
        zoom: 5
    });

    const map = (await registry.expectMapModel(mapId))?.olMap;
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

    const { mapId, registry } = await createMap({
        extent: extent
    });

    const xMin = extent.xMin + (extent.xMax - extent.xMin) / 2;
    const map = (await registry.expectMapModel(mapId))?.olMap;
    const view = map?.getView();

    expect(view?.getCenter()).toContain(xMin);
    expect(view?.getZoom()).toBe(0);
});

it("should successfully create View with default projection", async () => {
    const { mapId, registry } = await createMap();
    const map = (await registry.expectMapModel(mapId))?.olMap;
    const view = map?.getView();
    expect(view?.getProjection().getCode()).toBe("EPSG:3857");
});

it("should throw an exception if using wrong EPSG code", async () => {
    const { mapId, registry } = await createMap({
        projection: "EPSG:0000000000"
    });
    let error;
    try {
        await registry.expectMapModel(mapId);
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

it("should successfully create View with a custom projection", async () => {
    registerProjections({
        "EPSG:31466":
            "+proj=tmerc +lat_0=0 +lon_0=6 +k=1 +x_0=2500000 +y_0=0 +ellps=bessel +nadgrids=BETA2007.gsb +units=m +no_defs +type=crs"
    });

    const { mapId, registry } = await createMap({
        projection: "EPSG:31466"
    });

    const map = (await registry.expectMapModel(mapId))?.olMap;
    const view = map?.getView();
    expect(view?.getProjection().getCode()).toBe("EPSG:31466");
});

it("should construct a map with the configured layers", async () => {
    const { mapId, registry } = await createMap({
        layers: [
            {
                id: "id1",
                title: "foo",
                olLayer: new TileLayer({ source: new OSM() })
            },
            {
                id: "id2",
                title: "bar",
                visible: false,
                olLayer: new TileLayer({})
            }
        ]
    });

    const map = await registry.expectMapModel(mapId);
    const allLayers = map.layers.getLayers().map((layer) => {
        return {
            id: layer.id,
            title: layer.title,
            visible: layer.visible,
            loadState: layer.loadState
        };
    });

    expect(allLayers).toMatchInlineSnapshot(`
      [
        {
          "id": "id1",
          "loadState": "loaded",
          "title": "foo",
          "visible": true,
        },
        {
          "id": "id2",
          "loadState": "loaded",
          "title": "bar",
          "visible": false,
        },
      ]
    `);
});

async function createMap(options?: SimpleMapOptions): Promise<SetupMapResult> {
    return await setupMap({
        ...options,
        returnMap: false
    });
}
