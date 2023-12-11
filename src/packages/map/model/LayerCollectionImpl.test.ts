// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layer, SimpleLayer, WMSLayer } from "../api";
import { BkgTopPlusOpen } from "../layers/BkgTopPlusOpen";
import { MapModelImpl } from "./MapModelImpl";
import { createMapModel } from "./createMapModel";
import { SimpleLayerImpl } from "./layers/SimpleLayerImpl";
import { WMSLayerImpl } from "./layers/WMSLayerImpl";

let model: MapModelImpl | undefined;
afterEach(() => {
    vi.restoreAllMocks();
    model?.destroy();
    model = undefined;
});

it("makes the map layers accessible", async () => {
    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                title: "OSM",
                description: "OSM layer",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                title: "TopPlus Open",
                visible: false,
                olLayer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            })
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
    expect(model.olMap.getAllLayers().length).toBe(2);
});

it("supports ordered retrieval of layers", async () => {
    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                title: "OSM",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                title: "TopPlus Open",
                olLayer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            }),
            new SimpleLayer({
                title: "Base",
                isBaseLayer: true,
                olLayer: new TileLayer({})
            })
        ]
    });

    const layers = model.layers.getAllLayers({ sortByDisplayOrder: true });
    const titles = layers.map((l) => l.title);
    expect(titles).toMatchInlineSnapshot(`
      [
        "Base",
        "OSM",
        "TopPlus Open",
      ]
    `);

    const operationalLayers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
    const operationalLayerTitles = operationalLayers.map((l) => l.title);
    expect(operationalLayerTitles).toMatchInlineSnapshot(`
      [
        "OSM",
        "TopPlus Open",
      ]
    `);
});

it("generates automatic unique ids for layers", async () => {
    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                title: "OSM",
                description: "OSM layer",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                title: "TopPlus Open",
                visible: false,
                olLayer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            })
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

it("supports adding custom layer instances", async () => {
    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                id: "l1",
                title: "L1",
                olLayer: new TileLayer()
            }),
            new SimpleLayer({
                id: "l2",
                title: "L2",
                olLayer: new TileLayer()
            }),
            new WMSLayer({
                id: "l3",
                title: "L3",
                url: "https://example.com"
            })
        ]
    });

    const l1 = model.layers.getLayerById("l1");
    expect(l1).toBeInstanceOf(SimpleLayerImpl);

    const l2 = model.layers.getLayerById("l2");
    expect(l2).toBeInstanceOf(SimpleLayerImpl);

    const l3 = model.layers.getLayerById("l3");
    expect(l3).toBeInstanceOf(WMSLayerImpl);
});

it("supports lookup by layer id", async () => {
    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                id: "l-1",
                title: "OSM",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                id: "l-2",
                title: "TopPlus Open",
                olLayer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            })
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
                new SimpleLayer({
                    id: "l-1",
                    title: "OSM",
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayer({
                    id: "l-1",
                    title: "TopPlus Open",
                    olLayer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                })
            ]
        });
    }).rejects.toThrowErrorMatchingInlineSnapshot(
        "\"Layer id 'l-1' is not unique. Either assign a unique id yourself or skip configuring 'id' for an automatically generated id.\""
    );
});

it("supports reverse lookup from OpenLayers layer", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });
    const rawL2 = new TileLayer({
        source: new BkgTopPlusOpen()
    });

    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                id: "l-1",
                title: "OSM",
                olLayer: rawL1
            })
        ]
    });

    const l1 = model.layers.getLayerByRawInstance(rawL1);
    expect(l1?.id).toBe("l-1");

    const l2 = model.layers.getLayerByRawInstance(rawL2);
    expect(l2).toBeUndefined();
});

it("registering the same OpenLayers layer twice throws an error", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });

    await expect(async () => {
        model = await createMapModel("foo", {
            layers: [
                new SimpleLayer({
                    id: "l-1",
                    title: "OSM",
                    olLayer: rawL1
                }),
                new SimpleLayer({
                    id: "l-2",
                    title: "OSM",
                    olLayer: rawL1
                })
            ]
        });
    }).rejects.toThrowErrorMatchingInlineSnapshot(
        '"OlLayer has already been used in this or another layer."'
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

    const layer = new SimpleLayer({
        title: "foo",
        olLayer: new TileLayer({
            source: new OSM()
        }),
        visible: false
    });
    model.layers.addLayer(layer);
    expect(changed).toBe(1);
    expect(getLayerProps(layer)).toMatchInlineSnapshot(`
      {
        "description": "",
        "title": "foo",
        "visible": false,
      }
    `);
    expect(model.layers.getAllLayers()).toHaveLength(1);
    expect(model.layers.getAllLayers()[0]).toBe(layer);
});

it("supports removing a layer from the model", async () => {
    model = await createMapModel("foo", {
        layers: [
            new SimpleLayer({
                id: "l-1",
                title: "OSM",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            })
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
                new SimpleLayer({
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayer({
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                })
            ]
        });

        const layers = model.layers;
        const b1 = layers.getLayerById("b-1")! as SimpleLayerImpl;
        const b2 = layers.getLayerById("b-2")! as SimpleLayerImpl;

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

    it("switches base layer if active base layer has error state", async () => {
        const b1source = new OSM();
        const b2source = new OSM();
        const b3source = new OSM();

        const model = await createMapModel("foo", {
            layers: [
                new SimpleLayer({
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: b1source
                    })
                }),
                new SimpleLayer({
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: b2source
                    })
                }),
                new SimpleLayer({
                    id: "b-3",
                    title: "Base Layer 3",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: b3source
                    })
                })
            ]
        });

        const layers = model.layers;

        let eventsLayers = 0;
        layers.on("changed", () => ++eventsLayers);

        const b1 = layers.getLayerById("b-1")! as SimpleLayerImpl;
        const b2 = layers.getLayerById("b-2")! as SimpleLayerImpl;
        const b3 = layers.getLayerById("b-3")! as SimpleLayerImpl;

        let eventsb1 = 0,
            eventsb2 = 0,
            eventsb3 = 0;
        b1.on("changed:loadState", () => ++eventsb1);
        b2.on("changed:loadState", () => ++eventsb2);
        b3.on("changed:loadState", () => ++eventsb3);

        layers.activateBaseLayer(b1.id);

        // initial state
        expect(layers.getActiveBaseLayer()).toBe(b1);
        expect(eventsLayers).toBe(0);
        expect(eventsb1).toBe(0); // no change
        expect(b1.visible).toBe(true);
        expect(b1.olLayer.getVisible()).toBe(true);
        expect(eventsb2).toBe(0);
        expect(b2.visible).toBe(false);
        expect(b2.olLayer.getVisible()).toBe(false);
        expect(eventsb3).toBe(0);
        expect(b3.visible).toBe(false);
        expect(b3.olLayer.getVisible()).toBe(false);

        // layer, which is not the currently active base map, becomes unavailable -> no change of base map
        b3source.setState("error");
        expect(layers.getActiveBaseLayer()).toBe(b1);
        expect(eventsLayers).toBe(0);
        expect(eventsb1).toBe(0);
        expect(b1.visible).toBe(true);
        expect(b1.olLayer.getVisible()).toBe(true);
        expect(eventsb2).toBe(0);
        expect(b2.visible).toBe(false);
        expect(b2.olLayer.getVisible()).toBe(false);
        expect(eventsb3).toBe(1); // change event
        expect(b3.visible).toBe(false);
        expect(b3.olLayer.getVisible()).toBe(false);

        // fallback when layer becomes inactive
        b1source.setState("error");
        expect(layers.getActiveBaseLayer()).toBe(b2);
        expect(eventsLayers).toBe(1);
        expect(eventsb1).toBe(1); // change event
        expect(b1.visible).toBe(false);
        expect(b1.olLayer.getVisible()).toBe(false);
        expect(eventsb2).toBe(0);
        expect(b2.visible).toBe(true);
        expect(b2.olLayer.getVisible()).toBe(true);
        expect(eventsb3).toBe(1);
        expect(b3.visible).toBe(false);
        expect(b3.olLayer.getVisible()).toBe(false);

        // state change, but not to error -> no changes expected
        b2source.setState("loading");
        expect(layers.getActiveBaseLayer()).toBe(b2);
        expect(eventsLayers).toBe(1);
        expect(eventsb1).toBe(1);
        expect(b1.visible).toBe(false);
        expect(b1.olLayer.getVisible()).toBe(false);
        expect(eventsb2).toBe(1);
        expect(b2.visible).toBe(true);
        expect(b2.olLayer.getVisible()).toBe(true);
        expect(eventsb3).toBe(1);
        expect(b3.visible).toBe(false);
        expect(b3.olLayer.getVisible()).toBe(false);

        // switch to empty basemap as fallback
        b2source.setState("error");
        expect(layers.getActiveBaseLayer()).toBe(undefined);
        expect(eventsLayers).toBe(2);
        expect(eventsb1).toBe(1); // nothing changed
        expect(b1.visible).toBe(false);
        expect(b1.olLayer.getVisible()).toBe(false);
        expect(eventsb2).toBe(2); // change event
        expect(b2.visible).toBe(false);
        expect(b2.olLayer.getVisible()).toBe(false);
        expect(eventsb3).toBe(1);
        expect(b3.visible).toBe(false);
        expect(b3.olLayer.getVisible()).toBe(false);
    });

    it("supports removal of base layers", async () => {
        model = await createMapModel("foo", {
            layers: [
                new SimpleLayer({
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new SimpleLayer({
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                })
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

function getLayerProps(layer: Layer) {
    return {
        title: layer.title,
        description: layer.description,
        visible: layer.visible
    };
}
