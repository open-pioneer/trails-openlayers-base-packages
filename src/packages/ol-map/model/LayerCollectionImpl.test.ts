// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";
import ResizeObserver from "resize-observer-polyfill";
import { afterEach, expect, it, describe, vi } from "vitest";
import { LayerModel } from "../api";
import { MapModelImpl } from "./MapModelImpl";
import { createMapModel } from "./createMapModel";
// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

let model: MapModelImpl | undefined;
afterEach(() => {
    vi.restoreAllMocks();
    model?.destroy();
    model = undefined;
});

it("makes the map layers accessible", async () => {
    model = await createMapModel("foo", {
        layers: [
            {
                title: "OSM",
                description: "OSM layer",
                layer: new TileLayer({
                    source: new OSM()
                })
            },
            {
                title: "Watercolor",
                visible: false,
                layer: new TileLayer({
                    source: new Stamen({ layer: "watercolor" })
                })
            }
        ]
    });

    const layers = model.layers.getOperationalLayers();
    expect(layers.map(getLayerProps)).toMatchInlineSnapshot(`
      [
        {
          "description": "OSM layer",
          "title": "OSM",
          "visible": true,
        },
        {
          "description": "",
          "title": "Watercolor",
          "visible": false,
        },
      ]
    `);

    const baseLayers = model.layers.getBaseLayers();
    expect(baseLayers.length).toBe(0);

    const allLayers = model.layers.getAllLayers();
    expect(allLayers).toEqual(layers);
});

it("supports lookup by layer id", async () => {
    model = await createMapModel("foo", {
        layers: [
            {
                id: "l-1",
                title: "OSM",
                layer: new TileLayer({
                    source: new OSM()
                })
            },
            {
                id: "l-2",
                title: "Watercolor",
                layer: new TileLayer({
                    source: new Stamen({ layer: "watercolor" })
                })
            }
        ]
    });

    const layers = model.layers;
    const l1 = layers.getLayerById("l-1");
    expect(l1!.id).toBe("l-1");

    const l2 = layers.getLayerById("l-2");
    expect(l2!.id).toBe("l-2");

    const l3 = layers.getLayerById("l-3");
    expect(l3).toBeUndefined();
});

it("supports reverse lookup from open layers layer", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });
    const rawL2 = new TileLayer({
        source: new Stamen({ layer: "watercolor" })
    });

    model = await createMapModel("foo", {
        layers: [
            {
                id: "l-1",
                title: "OSM",
                layer: rawL1
            }
        ]
    });

    const l1 = model.layers.getLayerByRawInstance(rawL1);
    expect(l1?.id).toBe("l-1");

    const l2 = model.layers.getLayerByRawInstance(rawL2);
    expect(l2).toBeUndefined();
});

describe("base layers", () => {
    it("supports configuration and manipulation base layers", async () => {
        model = await createMapModel("foo", {
            layers: [
                {
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                }
            ]
        });

        const layers = model.layers;
        const b1 = layers.getLayerById("b-1")!;
        const b2 = layers.getLayerById("b-2")!;

        let events = 0;
        layers.on("changed", () => ++events);

        expect(layers.getActiveBaseLayer()).toBe(b1); // first base layer wins initially
        layers.activateBaseLayer(b1.id);
        expect(layers.getActiveBaseLayer()).toBe(b1); // noop
        expect(events).toBe(0); // no change
        expect(b1.visible).toBe(true);
        expect(b1.olLayer.getVisible()).toBe(true);
        expect(b2.visible).toBe(false);
        expect(b2.olLayer.getVisible()).toBe(false);

        layers.activateBaseLayer(b2.id);
        expect(layers.getActiveBaseLayer()).toBe(b2);
        expect(events).toBe(1); // change event
        expect(b1.visible).toBe(false);
        expect(b1.olLayer.getVisible()).toBe(false);
        expect(b2.visible).toBe(true);
        expect(b2.olLayer.getVisible()).toBe(true);

        layers.activateBaseLayer(undefined);
        expect(layers.getActiveBaseLayer()).toBeUndefined();
        expect(events).toBe(2);
        expect(b1.visible).toBe(false);
        expect(b1.olLayer.getVisible()).toBe(false);
        expect(b2.visible).toBe(false);
        expect(b2.olLayer.getVisible()).toBe(false);
    });

    it("supports removal of base layers", async () => {
        model = await createMapModel("foo", {
            layers: [
                {
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    layer: new TileLayer({
                        source: new OSM()
                    })
                }
            ]
        });

        const layers = model.layers;
        const b1 = layers.getLayerById("b-1")!;
        const b2 = layers.getLayerById("b-2")!;
        expect(layers.getBaseLayers().length).toBe(2);

        let events = 0;
        layers.on("changed", () => ++events);

        expect(layers.getActiveBaseLayer()).toBe(b1);

        // Switches to b2
        layers.removeLayerById(b1.id);
        expect(layers.getBaseLayers().length).toBe(1);
        expect(layers.getActiveBaseLayer()).toBe(b2);
        expect(events).toBe(1);

        // Switches to undefined
        layers.removeLayerById(b2.id);
        expect(layers.getActiveBaseLayer()).toBe(undefined);
        expect(events).toBe(2);
    });
});

function getLayerProps(layer: LayerModel) {
    return {
        title: layer.title,
        description: layer.description,
        visible: layer.visible
    };
}
