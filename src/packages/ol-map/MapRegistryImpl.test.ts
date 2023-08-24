// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { getErrorChain } from "@open-pioneer/core";
import { View } from "ol";
import { Attribution } from "ol/control";
import { afterEach, expect, it, vi } from "vitest";
import { registerProjections } from "./projections";
import { setupMap } from "./test-utils";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = require("resize-observer-polyfill");

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully create and destroy a mapModel", async () => {
    const { mapId, registry } = await setupMap();
    const mapModel = await registry.expectMapModel(mapId);
    expect(mapModel?.id).toBe(mapId);

    registry.destroy();

    await expect(() => registry.expectMapModel(mapId)).rejects.toThrowErrorMatchingInlineSnapshot(
        '"MapRegistry has already been destroyed."'
    );
});

it("should successfully set only Attribution when Controls are empty", async () => {
    const { mapId, registry } = await setupMap();
    const map = (await registry.expectMapModel(mapId))?.olMap;

    const controls = map?.getControls().getArray();
    const attributes = map?.getControls().getArray().at(0);
    expect(controls).toHaveLength(1);
    expect(attributes).toBeInstanceOf(Attribution);
});

it("should log warning message if new View is in advanced configuration and projection is set", async () => {
    const logSpy = vi.spyOn(global.console, "warn").mockImplementation(() => undefined);

    const view = new View({ center: [405948.17, 5757572.85], zoom: 5 });
    const { mapId, registry } = await setupMap({
        advanced: {
            view
        },
        projection: "EPSG:25832",
        noInitialView: true
    });
    await registry.expectMapModel(mapId);

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
    const { mapId, registry } = await setupMap({
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
    const { mapId, registry } = await setupMap({
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

    const { mapId, registry } = await setupMap({
        extent: extent
    });

    const xMin = extent.xMin + (extent.xMax - extent.xMin) / 2;
    const map = (await registry.expectMapModel(mapId))?.olMap;
    const view = map?.getView();

    expect(view?.getCenter()).toContain(xMin);
    expect(view?.getZoom()).toBe(0);
});

it("should successfully create View with default projection", async () => {
    const { mapId, registry } = await setupMap();
    const map = (await registry.expectMapModel(mapId))?.olMap;
    const view = map?.getView();
    expect(view?.getProjection().getCode()).toBe("EPSG:3857");
});

it("should throw an exception by wrong EPSG code", async () => {
    const { mapId, registry } = await setupMap({
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

it("should successfully create View with custom projection", async () => {
    registerProjections({
        "EPSG:25832":
            "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    });

    const { mapId, registry } = await setupMap({
        projection: "EPSG:25832"
    });

    const map = (await registry.expectMapModel(mapId))?.olMap;
    const view = map?.getView();
    expect(view?.getProjection().getCode()).toBe("EPSG:25832");
});
