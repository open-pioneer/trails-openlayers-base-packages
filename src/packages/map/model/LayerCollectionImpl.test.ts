// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/*
 * no xml parser in happy dom
 * @vitest-environment jsdom
 */
import { HttpService } from "@open-pioneer/http";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Layer, MapConfig, SimpleLayer, WMSLayer } from "../api";
import { MapModelImpl } from "./MapModelImpl";
import { createMapModel } from "./createMapModel";
import { SimpleLayerImpl } from "./layers/SimpleLayerImpl";
import { WMSLayerImpl } from "./layers/WMSLayerImpl";
import { syncWatch } from "@conterra/reactivity-core";
import { GroupLayer } from "../api/layers/GroupLayer";
import { Group } from "ol/layer";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const WMTS_CAPAS = readFileSync(
    resolve(THIS_DIR, "./layers/test-data/SimpleWMSCapas.xml"),
    "utf-8"
);

const MOCKED_HTTP_SERVICE = {
    fetch: vi.fn()
};

let model: MapModelImpl | undefined;
afterEach(() => {
    vi.restoreAllMocks();
    model?.destroy();
    model = undefined;
});

it("makes the map layers accessible", async () => {
    model = await create("foo", {
        layers: [
            new SimpleLayer({
                title: "OSM",
                description: "OSM layer",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                title: "Empty tile",
                visible: false,
                olLayer: new TileLayer()
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
          "title": "Empty tile",
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
    // OSM + TopPlus Open + "highlight-layer" = 3
    expect(model.olMap.getAllLayers().length).toBe(3);
});

it("supports ordered retrieval of layers", async () => {
    model = await create("foo", {
        layers: [
            new SimpleLayer({
                title: "OSM",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                title: "Empty tile",
                olLayer: new TileLayer()
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
        "Empty tile",
      ]
    `);

    const operationalLayers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
    const operationalLayerTitles = operationalLayers.map((l) => l.title);
    expect(operationalLayerTitles).toMatchInlineSnapshot(`
      [
        "OSM",
        "Empty tile",
      ]
    `);
});

it("generates automatic unique ids for layers", async () => {
    model = await create("foo", {
        layers: [
            new SimpleLayer({
                title: "OSM",
                description: "OSM layer",
                olLayer: new TileLayer({
                    source: new OSM()
                })
            }),
            new SimpleLayer({
                title: "Empty tile",
                visible: false,
                olLayer: new TileLayer()
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
    MOCKED_HTTP_SERVICE.fetch.mockImplementation(async (req: string) => {
        if (req.includes("GetCapabilities")) {
            // just valid enough to suppress error messages
            return new Response(WMTS_CAPAS, { status: 200 });
        }
        throw new Error("unexpected request");
    });

    model = await create("foo", {
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
    model = await create("foo", {
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
                title: "Empty tile",
                olLayer: new TileLayer()
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

it("supports lookup by layer id for members of a group layer", async () => {
    const olLayer = new TileLayer({
        source: new OSM()
    });

    const child = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    const group = new GroupLayer({
        id: "group",
        title: "group test",
        layers: [child]
    });

    model = await create("foo", {
        layers: [group]
    });

    const memberLayer = model.layers.getLayerById("member");
    expect(memberLayer).toBe(child);
    const groupLayer = model.layers.getLayerById("group");
    expect(groupLayer).toBe(group);
});

it("results in an error, if using the same layer id twice", async () => {
    await expect(async () => {
        model = await create("foo", {
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
                    title: "Empty tile",
                    olLayer: new TileLayer()
                })
            ]
        });
    }).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Layer id 'l-1' is not unique. Either assign a unique id yourself or skip configuring 'id' for an automatically generated id.]`
    );
});

it("supports reverse lookup from OpenLayers layer", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });
    const rawL2 = new TileLayer();

    model = await create("foo", {
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

it("supports reverse lookup from OpenLayers layer for members of a group layer", async () => {
    const olLayer = new TileLayer({
        source: new OSM()
    });

    model = await create("foo", {
        layers: [
            new GroupLayer({
                id: "group",
                title: "group test",
                layers: [
                    new SimpleLayerImpl({
                        id: "member",
                        title: "group member",
                        olLayer: olLayer
                    })
                ]
            })
        ]
    });

    const memberLayer = model.layers.getLayerByRawInstance(olLayer);
    expect(memberLayer).toBeDefined();
    const olGroup = model.olMap.getLayers().getArray()[1]; //get raw ol group la
    const groupLayer = model.layers.getLayerByRawInstance(olGroup!);
    expect(olGroup instanceof Group).toBeTruthy();
    expect(groupLayer).toBeDefined();
});

it("should unindex layers that are member of group layer", async () => {
    const olLayer = new TileLayer({
        source: new OSM()
    });

    model = await create("foo", {
        layers: [
            new GroupLayer({
                id: "group",
                title: "group test",
                layers: [
                    new SimpleLayerImpl({
                        id: "member",
                        title: "group member",
                        olLayer: olLayer
                    })
                ]
            })
        ]
    });

    let memberLayer = model.layers.getLayerByRawInstance(olLayer);
    expect(memberLayer).toBeDefined();
    memberLayer = model.layers.getLayerById("member") as Layer;
    expect(memberLayer).toBeDefined();

    //remove group layer and check if group members are not indexed anymore
    model.layers.removeLayerById("group");
    memberLayer = model.layers.getLayerByRawInstance(olLayer);
    expect(memberLayer).toBeUndefined();
    memberLayer = model.layers.getLayerById("member") as Layer;
    expect(memberLayer).toBeUndefined();
});

it("destroys child layers when parent group layer is removed", async () => {
    const olLayer = new TileLayer({
        source: new OSM()
    });

    const groupMember = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    const groupLayer = new GroupLayer({
        id: "group",
        title: "group test",
        layers: [groupMember]
    });
    //register dummy event handlers
    const groupFn = vi.fn();
    const memberFn = vi.fn();
    groupMember.on("destroy", () => memberFn());
    groupLayer.on("destroy", () => groupFn());

    model = await create("foo", {
        layers: [groupLayer]
    });

    model.layers.removeLayerById("group"); //remove group layer
    //destroy event should be emitted for each (child) layer
    expect(memberFn).toHaveBeenCalledOnce();
    expect(groupFn).toHaveBeenCalledOnce();
});

it("registering the same OpenLayers layer twice throws an error", async () => {
    const rawL1 = new TileLayer({
        source: new OSM()
    });

    await expect(async () => {
        model = await create("foo", {
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
        `[Error: OlLayer used by layer 'l-2' has already been used in map.]`
    );
});

it("supports adding a layer to the model", async () => {
    model = await create("foo", {
        layers: []
    });
    expect(model.layers.getAllLayers()).toHaveLength(0);

    let changed = 0;
    syncWatch(
        () => [model!.layers.getAllLayers()],
        () => {
            ++changed;
        }
    );

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
    model = await create("foo", {
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
    syncWatch(
        () => [model!.layers.getAllLayers()],
        () => {
            ++changed;
        }
    );

    expect(model.layers.getAllLayers()).toHaveLength(1);
    model.layers.removeLayerById("l-1");
    expect(changed).toBe(1);
    expect(model.layers.getAllLayers()).toHaveLength(0);
});

describe("base layers", () => {
    it("supports configuration and manipulation of base layers", async () => {
        model = await create("foo", {
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
        syncWatch(
            () => [model!.layers.getActiveBaseLayer()],
            () => {
                ++events;
            }
        );

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
        model = await create("foo", {
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
        syncWatch(
            () => [model!.layers.getAllLayers()],
            () => {
                ++events;
            }
        );

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

it("it should return all layers including children", async () => {
    const olBase = new TileLayer({
        source: new OSM()
    });
    const base = new SimpleLayerImpl({
        id: "base",
        title: "baselayer",
        olLayer: olBase,
        isBaseLayer: true
    });

    const olLayer = new TileLayer({
        source: new OSM()
    });
    const child = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    const group = new GroupLayer({
        id: "group",
        title: "group test",
        layers: [child]
    });

    model = await create("foo", {
        layers: [base, group]
    });

    const allLayers = model.layers.getRecursiveLayers().map((layer) => layer.id);

    // base & group & child, parents after children
    expect(allLayers).toMatchInlineSnapshot(`
      [
        "base",
        "member",
        "group",
      ]
    `);
});

it("it should return all operational layers including children", async () => {
    const olBase = new TileLayer({
        source: new OSM()
    });
    const base = new SimpleLayerImpl({
        id: "base",
        title: "baselayer",
        olLayer: olBase,
        isBaseLayer: true
    });

    const olLayer = new TileLayer({
        source: new OSM()
    });
    const child = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    const group = new GroupLayer({
        id: "group",
        title: "group test",
        layers: [child]
    });

    model = await create("foo", {
        layers: [base, group]
    });

    const allOperationalLayers = model.layers
        .getRecursiveLayers({ filter: "operational" })
        .map((layer) => layer.id);

    // group & child
    expect(allOperationalLayers).toMatchInlineSnapshot(`
      [
        "member",
        "group",
      ]
    `);
    expect(allOperationalLayers.length).toBe(2);
});

it("it should return all layers including children ordered by display order (asc)", async () => {
    const olBase = new TileLayer({
        source: new OSM()
    });
    const base = new SimpleLayerImpl({
        id: "base",
        title: "baselayer",
        olLayer: olBase,
        isBaseLayer: true
    });

    const olLayer = new TileLayer({
        source: new OSM()
    });
    const child = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    const group = new GroupLayer({
        id: "group",
        title: "group test",
        layers: [child]
    });

    model = await create("foo", {
        layers: [group, base] // order reversed to test sorting
    });

    const allLayers = model.layers.getRecursiveLayers({
        sortByDisplayOrder: true
    });
    expect(allLayers.length).toBe(3);
    expect(allLayers[0]).toBe(base);
    expect(allLayers[1]).toBe(child);
    expect(allLayers[2]).toBe(group);
});

function getLayerProps(layer: Layer) {
    return {
        title: layer.title,
        description: layer.description,
        visible: layer.visible
    };
}

function create(mapId: string, mapConfig: MapConfig) {
    return createMapModel(mapId, mapConfig, MOCKED_HTTP_SERVICE as HttpService);
}
