// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { constant, watchValue } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import { waitForInitialExtent } from "@open-pioneer/map-test-utils";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { waitFor } from "@testing-library/dom";
import { Coordinate } from "ol/coordinate";
import { LineString, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DPI } from "../utils/geometry-utils";
import { createMapModel } from "./createMapModel";
import { MapConfig } from "./MapConfig";
import { MapModel } from "./MapModel";

const MOCKED_HTTP_SERVICE = {
    fetch: vi.fn()
};

let model: MapModel | undefined;

afterEach(() => {
    model?.destroy();
    model = undefined;

    document.body.innerHTML = ""; // clear
    vi.restoreAllMocks();
});

describe("initial extent", () => {
    it("sets the initial extent if configured", async () => {
        const extent = {
            xMin: 577252,
            yMin: 6026906,
            xMax: 1790460,
            yMax: 7318386
        };
        model = await create("foo", {
            initialView: {
                kind: "extent",
                extent
            },
            projection: "EPSG:3857"
        });
        expect(model.initialExtent).toEqual(extent);

        const olMap = model.olMap;
        const oldCenter = olMap.getView().getCenter();
        const oldZoom = olMap.getView().getZoom();

        // Initially the map has no size.
        // The center is initialized from the extent's center, but zoom is set to 0.
        expect(olMap.getSize()).toBeFalsy();
        expect(oldZoom).toEqual(0);
        expect(oldCenter).toMatchInlineSnapshot(`
      [
        1183856,
        6672646,
      ]
    `);

        // Simulate mounting by setting an explicit size.
        // This triggers the extent initialization in MapModel.
        olMap.setSize([500, 500]);
        await waitFor(() => {
            if (olMap.getView().getZoom() === 0) {
                throw new Error("zoom did not change: view has not been initialized");
            }
        });

        const finalCenter = olMap.getView().getCenter();
        const finalZoom = olMap.getView().getZoom();
        expect(finalZoom).toBeCloseTo(3.6);
        expect(finalCenter).toEqual(oldCenter);
    });

    it("sets the initial extent if only center and zoom are configured", async () => {
        model = await create("foo", {
            initialView: {
                kind: "position",
                center: {
                    x: 1183856,
                    y: 6672646
                },
                zoom: 4
            },
            projection: "EPSG:3857"
        });
        expect(model.initialExtent).toBe(undefined);

        const olMap = model.olMap;
        const oldCenter = olMap.getView().getCenter();
        const oldZoom = olMap.getView().getZoom();

        // Center and zoom are set initially.
        expect(olMap.getSize()).toBeFalsy();
        expect(oldZoom).toEqual(4);
        expect(oldCenter).toMatchInlineSnapshot(`
      [
        1183856,
        6672646,
      ]
    `);

        // Simulate mounting by setting an explicit size.
        // This triggers the extent initialization in MapModel.
        olMap.setSize([500, 500]);
        await waitForInitialExtent(model);

        const initialExtent = model.initialExtent;
        if (!initialExtent) {
            throw new Error("initial extent not present");
        }

        const { xMin, xMax } = initialExtent;
        expect(xMin).toBeCloseTo(694659, -1);
        expect(xMax).toBeCloseTo(1673052, -1);
    });
});

it("tracks the OpenLayers target", async () => {
    model = await create("foo", {});
    expect(model.container).toBeUndefined();

    const div = document.createElement("div");
    model.olMap.setTarget(div);
    expect(model.container).toBe(div);

    model.olMap.setTarget(undefined);
    expect(model.container).toBeUndefined();
});

it("exposes the OpenLayers load status as a reactive property", async () => {
    model = await create("foo", {});

    const events: boolean[] = [];
    watchValue(
        () => model!.loading,
        (loading) => {
            events.push(loading);
        },
        { dispatch: "sync" }
    );

    expect(model.loading).toBe(false);
    expect(events.length).toBe(0);

    model.olMap.dispatchEvent("loadstart");
    expect(model.loading).toBe(true);
    expect(events).toEqual([true]);

    model.olMap.dispatchEvent("loadend");
    expect(model.loading).toBe(false);
    expect(events).toEqual([true, false]);
});

describe("zoom", () => {
    it("should successfully zoom for geometries", async () => {
        model = await create("foo", {});
        const olMap = model.olMap;

        const point = new Point([852011.307424, 6788511.322702]);
        const line = new LineString([
            [851890.680238, 6788133.616293],
            [859419.420804, 6790407.617885]
        ]);

        model.zoom([point], {});
        const zoomLevel = olMap.getView().getZoom();
        expect(zoomLevel).toBeTruthy();

        model.zoom([line], {});
        const zoomLevel2 = olMap.getView().getZoom();
        expect(zoomLevel2).toBeTruthy();

        expect(zoomLevel).not.toEqual(zoomLevel2);

        model.zoom([point], {});
        const newZoomLevel = olMap.getView().getZoom();
        expect(newZoomLevel).toBeTruthy();
        expect(newZoomLevel).toEqual(zoomLevel);
    });

    it("should successfully zoom with buffered geometries", async () => {
        model = await create("foo", {});
        const olMap = model.olMap;

        const line = new LineString([
            [851890.680238, 6788133.616293],
            [859419.420804, 6790407.617885]
        ]);

        model.zoom([line], {});
        const zoomLevel2 = olMap.getView().getZoom();
        expect(zoomLevel2).toBeTruthy();

        model.zoom([line], { buffer: 1.2 });
        const zoomLevel2WithBuffer = olMap.getView().getZoom();
        expect(zoomLevel2WithBuffer).toBeTruthy();
        expect(zoomLevel2WithBuffer).not.toEqual(zoomLevel2);
        if (typeof zoomLevel2WithBuffer != "number") {
            throw Error("Expected zoom level to be a number");
        }
        expect(zoomLevel2).toBeGreaterThan(zoomLevel2WithBuffer);
    });
});

describe("whenDisplayed", () => {
    it("notifies the user when the map is already being displayed", async () => {
        model = await create("foo", {});
        model.olMap.setSize([500, 500]); // simulate map mount

        await waitForInitialExtent(model);

        let ready = false;
        const promise = model.whenDisplayed().then(() => {
            ready = true;
        });
        await waitTick();
        expect(ready).toBe(true); // Resolves immediately

        await promise; // just to catch error (if any)
    });

    it("throws an error if map display already failed", async () => {
        model = await create("foo", {});
        model.destroy();

        let error: unknown;
        const promise = model.whenDisplayed().catch((e) => {
            error = e;
        });

        // promise rejects immediately
        await waitTick();
        expect(error).toMatchInlineSnapshot("[Error: Map model was destroyed.]");
        await promise;
    });

    it("notifies the user when the map is being displayed later", async () => {
        model = await create("foo", {});

        let ready = false;
        const promise = model.whenDisplayed().then(() => {
            ready = true;
        });

        // Wait a tick: the promise above does not resolve immediately because the map is not yet being displayed
        await waitTick();
        expect(ready).toBe(false);

        model.olMap.setSize([500, 500]); // simulate map mount
        await promise;

        expect(ready).toBe(true);
    });

    it("throws an error if the model is destroyed before being displayed", async () => {
        model = await create("foo", {});

        const promise = model.whenDisplayed();
        model.destroy();

        await expect(promise).rejects.toMatchInlineSnapshot("[Error: Map model was destroyed.]");
    });
});

describe("scale", () => {
    it("round trips setScale() -> scale in EPSG:4326", async () => {
        model = await createAt("EPSG:4326", [7.5, 51.5]);

        model.setScale(50000);
        expect(model.scale).toBe(50000);
    });

    it("round trips every scale-setter default scale in EPSG:4326", async () => {
        model = await createAt("EPSG:4326", [7.5, 51.5]);

        for (const scale of [17471320, 1091957, 68247, 2132]) {
            model.setScale(scale);
            expect(model.scale).toBe(scale);
        }
    });

    it("round trips setScale() -> scale in EPSG:3857", async () => {
        model = await createAt("EPSG:3857", fromLonLat([7.5, 51.5]));

        model.setScale(50000);
        expect(model.scale).toBe(50000);
    });

    it("reports the scale as a rounded denominator", async () => {
        model = await createAt("EPSG:3857", fromLonLat([7.5, 51.5]));

        // A pixel is 0.28mm, so 10m per pixel on the ground is 1:35714.2857...
        model.olView.setResolution(10 / Math.cos((51.5 * Math.PI) / 180));
        expect(model.scale).toBe(35714);
    });

    it("changes the scale when the map is panned in EPSG:4326", async () => {
        // The point resolution depends on the center, so panning north must change the scale even
        // though the view resolution stays the same.
        model = await createAt("EPSG:4326", [7.5, 51.5]);

        const atStart = model.scale;
        model.olView.setCenter([7.5, 80]);

        expect(model.scale).toBeLessThan(atStart!);
    });
});

describe("getCenterPointResolution", () => {
    it("converts the view resolution to meters per pixel in EPSG:4326", async () => {
        model = await createAt("EPSG:4326", [7.5, 0]);
        model.olView.setResolution(0.0001);

        // One degree of arc is 6371008.8 * PI / 180 = 111195.08m on the sphere OpenLayers
        // measures on, and at the equator a pixel spans one degree in both directions.
        expect(model.resolution).toBe(0.0001);
        expect(model.getCenterPointResolution()).toBeCloseTo(11.1195, 4);
    });

    it("equals resolution * cos(latitude) in EPSG:3857", async () => {
        model = await createAt("EPSG:3857", fromLonLat([7.5, 60]));
        model.olView.setResolution(10);

        // Web Mercator inflates distances by 1 / cos(latitude); cos(60 degrees) is 0.5.
        expect(model.getCenterPointResolution()).toBeCloseTo(5, 9);
    });
});

describe("getViewResolutionForScale", () => {
    it("returns projection units per pixel, not meters per pixel", async () => {
        model = await createAt("EPSG:4326", [7.5, 51.5]);

        const viewResolution = model.getViewResolutionForScale(50000)!;
        expect(viewResolution).toBeCloseTo(0.000155, 6);
        expect(model.getCenterPointResolution()).not.toBeCloseTo(viewResolution, 6);
    });

    it("scales the resolution down for a higher target dpi", async () => {
        model = await createAt("EPSG:3857", fromLonLat([7.5, 51.5]));

        const atScreenDpi = model.getViewResolutionForScale(50000)!;
        const atDoubleDpi = model.getViewResolutionForScale(50000, DEFAULT_DPI * 2)!;
        expect(atDoubleDpi).toBeCloseTo(atScreenDpi / 2, 9);
    });
});

async function createAt(projection: string, center: Coordinate): Promise<MapModel> {
    const model = await create("foo", {
        projection,
        initialView: {
            kind: "position",
            center: { x: center[0]!, y: center[1]! },
            zoom: 10
        }
    });
    return model;
}

function create(mapId: string, mapConfig: MapConfig) {
    return createMapModel(
        mapId,
        mapConfig,
        constant(createIntl()),
        MOCKED_HTTP_SERVICE as HttpService
    );
}

function waitTick() {
    return new Promise<void>((resolve) => resolve());
}
