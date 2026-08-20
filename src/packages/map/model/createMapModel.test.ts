// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { constant } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import { createTestLayer, createTestOlLayer } from "@open-pioneer/map-test-utils";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { it, expect, vi, afterEach } from "vitest";
import { SimpleLayer } from "../layers/SimpleLayer";
import { createMapModel } from "./createMapModel";
import { MapConfig } from "./MapConfig";
import { MapModel } from "./MapModel";

const MOCKED_HTTP_SERVICE = {
    fetch: vi.fn()
};

let model: MapModel | undefined;
afterEach(() => {
    vi.restoreAllMocks();
    model?.destroy();
    model = undefined;
});

it("supports adding topmost layers to the model in MapConfig", async () => {
    const layerTopMost = createTestLayer({
        type: SimpleLayer,
        title: "topmost1",
        olLayer: createTestOlLayer()
    });
    const layerTopMost2 = createTestLayer({
        type: SimpleLayer,
        title: "topmost2",
        olLayer: createTestOlLayer()
    });

    const model = await create("foo", {
        layers: [
            createTestLayer({
                type: SimpleLayer,
                title: "dummy1",
                id: "dummy1",
                olLayer: createTestOlLayer()
            })
        ],
        topmostLayers: [layerTopMost, layerTopMost2] //all topmostLayers should be above layers, layerTopMost2 should be above layerTopMost
    });

    const layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
    expect(layers).toHaveLength(3);
    expect(layers[layers.length - 1]).toBe(layerTopMost2);
    expect(layers[layers.length - 2]).toBe(layerTopMost);
});

it("supports adding base layers to the model in MapConfig", async () => {
    const layerBase = createTestLayer({
        type: SimpleLayer,
        title: "base1",
        olLayer: createTestOlLayer(),
        visible: true
    });
    const layerBase2 = createTestLayer({
        type: SimpleLayer,
        title: "base2",
        olLayer: createTestOlLayer(),
        visible: true
    });

    const model = await create("foo", {
        layers: [
            createTestLayer({
                type: SimpleLayer,
                title: "dummy1",
                id: "dummy1",
                olLayer: createTestOlLayer()
            })
        ],
        baseLayers: [layerBase, layerBase2]
    });

    const allLayers = model.layers.getLayers();
    expect(allLayers).toHaveLength(3);
    const baseLayers = model.layers.getBaseLayers();
    expect(baseLayers).toHaveLength(2);
    expect(model.layers.getActiveBaseLayer()).toBe(layerBase);
});

function create(mapId: string, mapConfig: MapConfig) {
    return createMapModel(
        mapId,
        mapConfig,
        constant(createIntl()),
        MOCKED_HTTP_SERVICE as HttpService
    );
}
