// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { watchValue } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import { waitForInitialExtent } from "@open-pioneer/map-test-utils";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { waitFor } from "@testing-library/dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapConfig } from "./MapConfig";
import { MapModel } from "./MapModel";
import { createMapModel } from "./createMapModel";

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

function create(mapId: string, mapConfig: MapConfig) {
    return createMapModel(mapId, mapConfig, createIntl(), MOCKED_HTTP_SERVICE as HttpService);
}

function waitTick() {
    return new Promise<void>((resolve) => resolve());
}
