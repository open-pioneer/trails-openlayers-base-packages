// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { BkgTopPlusOpen } from "../BkgTopPlusOpen";
import { afterEach, expect, it, describe, vi } from "vitest";
import { LayerModel } from "../api";
import { MapModelImpl } from "./MapModelImpl";
import { createMapModel } from "./createMapModel";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
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
                title: "TopPlus Open",
                visible: false,
                layer: new TileLayer({
                    source: new BkgTopPlusOpen()
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
          "title": "TopPlus Open",
          "visible": false,
        },
      ]
    `);

    // z-orders are currently assigned incrementally. the specific values
    // do not really matter (the algorithm may change in the future), but they must
    // a) be on top of base layers
    // b) on top of each other (depending on configured order)
    const zOrders = layers.map((l) => l.olLayer.getZIndex());
    expect(zOrders).toMatchInlineSnapshot(`
      [
        1,
        2,
      ]
    `);

    const baseLayers = model.layers.getBaseLayers();
    expect(baseLayers.length).toBe(0);

    const allLayers = model.layers.getAllLayers();
    expect(allLayers).toEqual(layers);
});

it("generates automatic unique ids for layers", async () => {
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
                title: "TopPlus Open",
                visible: false,
                layer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            }
        ]
    });

    const ids = model.layers.getAllLayers().map((l) => l.id);
    const verifyId = (id: unknown, message: string) => {
        expect(id, message).toBeTypeOf("string");
        expect((id as string).length, message).toBeGreaterThan(0);
    };

    verifyId(ids[0], "id 0");
    verifyId(ids[1], "id 1");
    expect(ids[0]).not.toEqual(ids[1]);
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
                title: "TopPlus Open",
                layer: new TileLayer({
                    source: new BkgTopPlusOpen()
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

it("results in an error, if using the same layer id twice", async () => {
    await expect(async () => {
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
                    id: "l-1",
                    title: "TopPlus Open",
                    layer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });
    }).rejects.toThrowErrorMatchingInlineSnapshot(
        "\"Layer id 'l-1' is not unique. Either assign a unique id or skip the id property to generate an automatic id.\""
    );
});

it("supports reverse lookup from open layers layer", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });
    const rawL2 = new TileLayer({
        source: new BkgTopPlusOpen()
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

it("registering the same open layers layer twice throws an error", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });

    await expect(async () => {
        model = await createMapModel("foo", {
            layers: [
                {
                    id: "l-1",
                    title: "OSM",
                    layer: rawL1
                },
                {
                    id: "l-2",
                    title: "OSM",
                    layer: rawL1
                }
            ]
        });
    }).rejects.toThrowErrorMatchingInlineSnapshot(
        '"OlLayer has already been used in this or another LayerModel."'
    );
});

it("supports adding a layer to the model", async () => {
    model = await createMapModel("foo", {
        layers: []
    });
    expect(model.layers.getAllLayers()).toHaveLength(0);

    let changed = 0;
    model.layers.on("changed", () => {
        ++changed;
    });

    const layerModel = model.layers.createLayer({
        title: "foo",
        layer: new TileLayer({
            source: new OSM()
        }),
        visible: false
    });
    expect(changed).toBe(1);
    expect(getLayerProps(layerModel)).toMatchInlineSnapshot(`
      {
        "description": "",
        "title": "foo",
        "visible": false,
      }
    `);
    expect(model.layers.getAllLayers()).toHaveLength(1);
    expect(model.layers.getAllLayers()[0]).toBe(layerModel);
});

it("supports removing a layer from the model", async () => {
    model = await createMapModel("foo", {
        layers: [
            {
                id: "l-1",
                title: "OSM",
                layer: new TileLayer({
                    source: new OSM()
                })
            }
        ]
    });

    let changed = 0;
    model.layers.on("changed", () => {
        ++changed;
    });

    expect(model.layers.getAllLayers()).toHaveLength(1);
    model.layers.removeLayerById("l-1");
    expect(changed).toBe(1);
    expect(model.layers.getAllLayers()).toHaveLength(0);
});

describe("base layers", () => {
    it("supports configuration and manipulation of base layers", async () => {
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

        const zOrders = [b1, b2].map((l) => l.olLayer.getZIndex());
        expect(zOrders).toEqual([0, 0]); // base layers always have z-index 0

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
