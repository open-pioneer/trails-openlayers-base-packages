// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { constant } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import { createTestLayer, createTestOlLayer } from "@open-pioneer/map-test-utils";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { Tile } from "ol/layer";
import OlBaseLayer from "ol/layer/Base";
import { OSM } from "ol/source";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("fallback layer", () => {
    // Does not make a lot of sense, but this was present since the very beginning.
    it("creates a fallback OSM layer if the user does not specify any layers", async () => {
        const model = await create("foo", {});
        expect(model.layers.getRecursiveLayers()).toEqual([]); // no "real" layers

        const olLayers = model.olMap.getLayers().getArray();
        expect(olLayers.length).toBeGreaterThan(0);

        const osm = findOsmLayer(olLayers);
        expect(osm).toBeDefined();
    });

    it("does not create a fallback OSM layer if the baseLayers option is used", async () => {
        const model = await create("foo", {
            baseLayers: []
        });

        const olLayers = model.olMap.getLayers().getArray();
        const osm = findOsmLayer(olLayers);
        expect(osm).toBeUndefined();
    });

    it("does not create a fallback OSM layer if the layers option is used", async () => {
        const model = await create("foo", {
            layers: []
        });

        const olLayers = model.olMap.getLayers().getArray();
        const osm = findOsmLayer(olLayers);
        expect(osm).toBeUndefined();
    });

    it("does not create a fallback OSM layer if the topmostLayers option is used", async () => {
        const model = await create("foo", {
            topmostLayers: []
        });

        const olLayers = model.olMap.getLayers().getArray();
        const osm = findOsmLayer(olLayers);
        expect(osm).toBeUndefined();
    });
});

function findOsmLayer(olLayers: OlBaseLayer[]) {
    return olLayers.find(
        (olLayer) => olLayer instanceof Tile && olLayer.getSource() instanceof OSM
    );
}

function create(mapId: string, mapConfig: MapConfig) {
    return createMapModel(
        mapId,
        mapConfig,
        constant(createIntl()),
        MOCKED_HTTP_SERVICE as HttpService
    );
}
