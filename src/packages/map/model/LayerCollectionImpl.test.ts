// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/*
 * no xml parser in happy dom
 * @vitest-environment jsdom
 */
import { syncEffect, syncWatch } from "@conterra/reactivity-core";
import { onSync } from "@conterra/reactivity-events";
import { throwAbortError } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { createTestLayer, createTestOlLayer } from "@open-pioneer/map-test-utils";
import { createIntl } from "@open-pioneer/test-utils/vanilla";
import { waitFor } from "@testing-library/dom";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Group } from "ol/layer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupLayer } from "../layers/GroupLayer";
import { SimpleLayer } from "../layers/SimpleLayer";
import { AnyLayer, Layer } from "../layers/unions";
import { WMSLayer } from "../layers/WMSLayer";
import { WMTSLayer } from "../layers/WMTSLayer";
import { createMapModel } from "./createMapModel";
import { MapConfig } from "./MapConfig";
import { MapModelImpl } from "./MapModelImpl";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const WMTS_CAPAS = readFileSync(
    resolve(THIS_DIR, "../layers/wms/test-data/SimpleWMSCapas.xml"),
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
            createTestLayer({
                type: SimpleLayer,
                title: "Some base layer",
                visible: false,
                olLayer: dummyLayer(),
                isBaseLayer: true
            }),
            createTestLayer({
                type: SimpleLayer,
                title: "OSM",
                description: "OSM layer",
                olLayer: dummyLayer()
            }),
            createTestLayer({
                type: SimpleLayer,
                title: "Empty tile",
                visible: false,
                olLayer: dummyLayer()
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

    // Z-Index is assigned internally based on the display order of layers.
    await waitForZIndex(layers[0]!);
    const zIndices = getZIndices(layers);
    expect(zIndices).toMatchInlineSnapshot(`
      {
        "Empty tile": 2,
        "OSM": 1,
      }
    `);

    const baseLayers = model.layers.getBaseLayers();
    expect(baseLayers.length).toBe(1);

    const allLayers = model.layers.getLayers();
    expect(allLayers).toEqual([...baseLayers, ...layers]);
    // Basemap + OSM + TopPlus Open + "highlight-layer" = 4
    expect(model.olMap.getAllLayers().length).toBe(4);
});

it("supports ordered retrieval of layers", async () => {
    model = await create("foo", {
        layers: [
            createTestLayer({
                type: SimpleLayer,
                title: "OSM",
                olLayer: dummyLayer()
            }),
            createTestLayer({
                type: SimpleLayer,
                title: "Empty tile",
                olLayer: dummyLayer()
            }),
            createTestLayer({
                type: SimpleLayer,
                title: "Base",
                isBaseLayer: true,
                olLayer: createTestOlLayer()
            })
        ]
    });

    const layers = model.layers.getLayers({ sortByDisplayOrder: true });
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
            createTestLayer({
                type: SimpleLayer,
                title: "OSM",
                description: "OSM layer",
                olLayer: dummyLayer()
            }),
            createTestLayer({
                type: SimpleLayer,
                title: "Empty tile",
                visible: false,
                olLayer: dummyLayer()
            })
        ]
    });

    const ids = model.layers.getLayers().map((l) => l.id);
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
            createTestLayer({
                type: SimpleLayer,
                id: "l1",
                title: "L1",
                olLayer: dummyLayer()
            }),
            createTestLayer({
                type: SimpleLayer,
                id: "l2",
                title: "L2",
                olLayer: dummyLayer()
            }),
            createTestLayer(
                {
                    type: WMSLayer,
                    id: "l3",
                    title: "L3",
                    url: "https://example.com"
                },
                { fetch: vi.fn().mockImplementation(async () => new Response("", { status: 200 })) }
            )
        ]
    });

    const l1 = model.layers.getLayerById("l1");
    expect(l1).toBeInstanceOf(SimpleLayer);

    const l2 = model.layers.getLayerById("l2");
    expect(l2).toBeInstanceOf(SimpleLayer);

    const l3 = model.layers.getLayerById("l3");
    expect(l3).toBeInstanceOf(WMSLayer);
});

it("destroys child layers when parent group layer is removed", async () => {
    const groupMember = createTestLayer({
        type: SimpleLayer,
        id: "member",
        title: "group member",
        olLayer: dummyLayer()
    });
    const groupLayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [groupMember]
    });

    //register dummy event handlers
    const groupFn = vi.fn();
    const memberFn = vi.fn();
    onSync(groupMember.destroyEvent, memberFn);
    onSync(groupLayer.destroyEvent, groupFn);

    model = await create("foo", {
        layers: [groupLayer]
    });

    model.layers.removeLayerById("group"); //remove group layer
    //destroy event should be emitted for each (child) layer
    expect(memberFn).toHaveBeenCalledOnce();
    expect(groupFn).toHaveBeenCalledOnce();
});

describe("layer lookup", () => {
    it("supports lookup by layer id", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    id: "l-1",
                    title: "OSM",
                    olLayer: dummyLayer()
                }),
                createTestLayer({
                    type: SimpleLayer,
                    id: "l-2",
                    title: "Empty tile",
                    olLayer: dummyLayer()
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
        const child = createTestLayer({
            type: SimpleLayer,
            id: "member",
            title: "group member",
            olLayer: dummyLayer()
        });
        const group = createTestLayer({
            type: GroupLayer,
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
                    createTestLayer({
                        type: SimpleLayer,
                        id: "l-1",
                        title: "OSM",
                        olLayer: dummyLayer()
                    }),
                    createTestLayer({
                        type: SimpleLayer,
                        id: "l-1",
                        title: "Empty tile",
                        olLayer: dummyLayer()
                    })
                ]
            });
        }).rejects.toThrowErrorMatchingInlineSnapshot(
            `[Error: Layer id 'l-1' is not unique. Either assign a unique id yourself or skip configuring 'id' for an automatically generated id.]`
        );
    });

    it("supports reverse lookup from OpenLayers layer", async () => {
        const rawL1 = dummyLayer();
        const rawL2 = dummyLayer();

        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
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
        const olLayer = dummyLayer();

        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: GroupLayer,
                    id: "group",
                    title: "group test",
                    layers: [
                        createTestLayer({
                            type: SimpleLayer,
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

    it("should un-index layers that are member of group layer", async () => {
        const olLayer = dummyLayer();

        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: GroupLayer,
                    id: "group",
                    title: "group test",
                    layers: [
                        createTestLayer({
                            type: SimpleLayer,
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

    it("registering the same OpenLayers layer twice throws an error", async () => {
        const rawL1 = dummyLayer();

        await expect(async () => {
            model = await create("foo", {
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        id: "l-1",
                        title: "OSM",
                        olLayer: rawL1
                    }),
                    createTestLayer({
                        type: SimpleLayer,
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
});

describe("adding and removing layers", () => {
    it("supports adding a layer to the model (default)", async () => {
        model = await create("foo", {
            layers: []
        });
        expect(model.layers.getLayers()).toHaveLength(0);

        let changed = 0;
        syncWatch(
            () => [model!.layers.getLayers()],
            () => {
                ++changed;
            }
        );

        const layer = createTestLayer({
            type: SimpleLayer,
            title: "foo",
            olLayer: dummyLayer(),
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
        expect(model.layers.getLayers()).toHaveLength(1);
        expect(model.layers.getLayers()[0]).toBe(layer);
    });

    it("supports adding a layer to the model (top)", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy1",
                    olLayer: dummyLayer()
                })
            ]
        });

        const layer = createTestLayer({
            type: SimpleLayer,
            title: "foo",
            olLayer: dummyLayer(),
            visible: false
        });
        model.layers.addLayer(layer, { at: "top" });
        const layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers).toHaveLength(2);
        expect(layers[layers.length - 1]).toBe(layer);

        await waitForZIndex(layer);
        const zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy1": 0,
            "foo": 1,
          }
        `);
    });

    it("supports adding a layer to the model (bottom)", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy1",
                    olLayer: dummyLayer()
                })
            ]
        });

        const layer = createTestLayer({
            type: SimpleLayer,
            title: "foo",
            olLayer: dummyLayer()
        });
        model.layers.addLayer(layer, { at: "bottom" });
        const layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers).toHaveLength(2);
        expect(layers[0]).toBe(layer);

        await waitForZIndex(layer);
        const zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy1": 1,
            "foo": 0,
          }
        `);
    });

    it("supports adding a layer to the model (above / below)", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy1",
                    id: "dummy1",
                    olLayer: dummyLayer()
                }),
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy2",
                    id: "dummy2",
                    olLayer: dummyLayer()
                }),
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy3",
                    id: "dummy3",
                    olLayer: dummyLayer()
                })
            ]
        });

        const layerAbove = createTestLayer({
            type: SimpleLayer,
            title: "above 1",
            olLayer: dummyLayer()
        });
        const layerBelow = createTestLayer({
            type: SimpleLayer,
            title: "below 3",
            olLayer: dummyLayer()
        });

        model.layers.addLayer(layerAbove, { at: "above", reference: "dummy1" });
        model.layers.addLayer(layerBelow, { at: "below", reference: "dummy3" });
        const layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers).toHaveLength(5);
        expect(layers[1]).toBe(layerAbove);
        expect(layers[3]).toBe(layerBelow);

        await waitForZIndex(layerAbove);
        const zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "above 1": 1,
            "below 3": 3,
            "dummy1": 0,
            "dummy2": 2,
            "dummy3": 4,
          }
        `);
    });

    it("supports adding a layer to the model (topmost)", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy1",
                    id: "dummy1",
                    olLayer: dummyLayer()
                })
            ]
        });

        const layerTopMost = createTestLayer({
            type: SimpleLayer,
            title: "topmost1",
            olLayer: dummyLayer()
        });
        const layerTopMost2 = createTestLayer({
            type: SimpleLayer,
            title: "topmost2",
            olLayer: dummyLayer()
        });

        model.layers.addLayer(layerTopMost, { at: "topmost" });
        let layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost);
        await waitForZIndex(layerTopMost);
        let zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy1": 0,
            "topmost1": 1,
          }
        `);

        model.layers.addLayer(layerTopMost2, { at: "topmost" }); //should be above topmost1
        layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost2);
        expect(layers[layers.length - 2]).toBe(layerTopMost);
        await waitForZIndex(layerTopMost2);
        zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy1": 0,
            "topmost1": 1,
            "topmost2": 2,
          }
        `);

        const oldZIndex = layerTopMost2.olLayer.getZIndex();
        model.layers.removeLayerById(layerTopMost.id); //remove (first) topmost
        layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost2);
        await waitForUpdatedZIndex(layerTopMost2, oldZIndex);
        zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy1": 0,
            "topmost2": 1,
          }
        `);
    });

    it("it throws error if reference layer is not a top level operational layer", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy",
                    id: "dummy",
                    olLayer: dummyLayer()
                })
            ]
        });

        const baseLayer = createTestLayer({
            type: SimpleLayer,
            title: "base",
            id: "base",
            isBaseLayer: true,
            olLayer: dummyLayer()
        });
        const childLayer = createTestLayer({
            type: SimpleLayer,
            title: "child",
            id: "child",
            olLayer: dummyLayer()
        });
        const groupLayer = createTestLayer({
            type: GroupLayer,
            title: "group",
            id: "group",
            layers: [childLayer]
        });

        model.layers.addLayer(baseLayer);
        model.layers.addLayer(groupLayer);

        const otherLayer = createTestLayer({
            type: SimpleLayer,
            title: "other1",
            id: "other1",
            olLayer: dummyLayer()
        });
        expect(() => {
            model!.layers.addLayer(otherLayer, { at: "below", reference: baseLayer });
        }).toThrowError("base layer");

        const otherLayer2 = createTestLayer({
            type: SimpleLayer,
            title: "other2",
            id: "other2",
            olLayer: dummyLayer()
        });
        expect(() => {
            model!.layers.addLayer(otherLayer2, { at: "above", reference: childLayer });
        }).toThrowError("child layer");
    });

    it("supports removing a layer from the model (old API)", async () => {
        const layer = createTestLayer({
            type: SimpleLayer,
            id: "l-1",
            title: "OSM",
            olLayer: dummyLayer()
        });
        model = await create("foo", {
            layers: [layer]
        });

        const ids: (string | undefined)[] = [];
        syncEffect(() => {
            ids.push(model?.layers.getLayerById("l-1")?.id);
        });

        expect(ids).toEqual(["l-1"]);
        expect(layer.destroyed).toBe(false);

        model.layers.removeLayerById("l-1");
        expect(layer.destroyed).toBe(true); // destroyed (backwards compat)
        expect(ids).toEqual(["l-1", undefined]);
    });

    it("supports removing a layer from the model", async () => {
        const layer = createTestLayer({
            type: SimpleLayer,
            id: "l-1",
            title: "OSM",
            olLayer: dummyLayer()
        });
        model = await create("foo", {
            layers: [layer]
        });

        const ids: (string | undefined)[] = [];
        syncEffect(() => {
            ids.push(model?.layers.getLayerById("l-1")?.id);
        });

        expect(ids).toEqual(["l-1"]);

        const result = model.layers.removeLayer("l-1")!;
        expect(result).toBe(layer);
        expect(layer.destroyed).toBe(false); // not destroyed
        expect(ids).toEqual(["l-1", undefined]);

        model.destroy();
        // still not destroyed since layer was no longer owned by the map
        expect(layer.destroyed).toBe(false);
    });

    it("always assigns the highest zIndex to a layer inserted at topmost", async () => {
        model = await create("foo", {});

        const layerTopMost = createTestLayer({
            type: SimpleLayer,
            title: "topmost",
            olLayer: dummyLayer()
        });
        const layerOther = createTestLayer({
            type: SimpleLayer,
            title: "other",
            olLayer: dummyLayer()
        });

        model.layers.addLayer(layerTopMost, { at: "topmost" });
        let layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost);
        await waitForZIndex(layerTopMost);
        let zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "topmost": 0,
          }
        `);

        model.layers.addLayer(layerOther, { at: "top" }); //top should be below topmost
        layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost);
        expect(layers[layers.length - 2]).toBe(layerOther);
        await waitForZIndex(layerOther);
        zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "other": 0,
            "topmost": 1,
          }
        `);
    });

    it("supports adding a layer to the model (above/below with top most layer as reference)", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    title: "dummy",
                    id: "dummy",
                    olLayer: dummyLayer()
                })
            ]
        });

        const layerTopMost = createTestLayer({
            type: SimpleLayer,
            title: "topmost",
            id: "topmost",
            olLayer: dummyLayer()
        });
        const layerTopMostBelow = createTestLayer({
            type: SimpleLayer,
            title: "topmostbelow",
            id: "topmostbelow",
            olLayer: dummyLayer()
        });
        const layerTopMostAbove = createTestLayer({
            type: SimpleLayer,
            title: "topmostabove",
            id: "topmostabove",
            olLayer: dummyLayer()
        });
        const layerOther = createTestLayer({
            type: SimpleLayer,
            title: "other",
            id: "other",
            olLayer: dummyLayer()
        });
        model.layers.addLayer(layerTopMost, { at: "topmost" });
        model.layers.addLayer(layerTopMostBelow, { at: "below", reference: layerTopMost });
        model.layers.addLayer(layerOther, { at: "top" });
        let layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost);
        expect(layers[layers.length - 2]).toBe(layerTopMostBelow);
        await waitForZIndex(layerOther);
        let zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy": 0,
            "other": 1,
            "topmost": 3,
            "topmostbelow": 2,
          }
        `);

        model.layers.addLayer(layerTopMostAbove, { at: "above", reference: layerTopMostBelow });
        layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost);
        expect(layers[layers.length - 2]).toBe(layerTopMostAbove);
        expect(layers[layers.length - 3]).toBe(layerTopMostBelow);
        await waitForZIndex(layerTopMostAbove);
        zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy": 0,
            "other": 1,
            "topmost": 4,
            "topmostabove": 3,
            "topmostbelow": 2,
          }
        `);

        model.layers.removeLayerById(layerTopMostBelow.id);
        layers = model.layers.getOperationalLayers({ sortByDisplayOrder: true });
        expect(layers[layers.length - 1]).toBe(layerTopMost);
        expect(layers[layers.length - 2]).toBe(layerTopMostAbove);
        await waitForUpdatedZIndex(layerTopMostAbove, 3);
        zIndices = getZIndices(layers);
        expect(zIndices).toMatchInlineSnapshot(`
          {
            "dummy": 0,
            "other": 1,
            "topmost": 3,
            "topmostabove": 2,
          }
        `);
    });
});

describe("base layers", () => {
    it("supports configuration and manipulation of base layers", async () => {
        model = await create("foo", {
            layers: [
                createTestLayer({
                    type: SimpleLayer,
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    olLayer: dummyLayer()
                }),
                createTestLayer({
                    type: SimpleLayer,
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    olLayer: dummyLayer()
                })
            ]
        });

        const layers = model.layers;
        const b1 = layers.getLayerById("b-1")! as SimpleLayer;
        const b2 = layers.getLayerById("b-2")! as SimpleLayer;

        let events = 0;
        syncWatch(
            () => [model!.layers.getActiveBaseLayer()],
            () => {
                ++events;
            }
        );

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
                createTestLayer({
                    type: SimpleLayer,
                    id: "b-1",
                    title: "Base Layer 1",
                    isBaseLayer: true,
                    olLayer: dummyLayer()
                }),
                createTestLayer({
                    type: SimpleLayer,
                    id: "b-2",
                    title: "Base Layer 2",
                    isBaseLayer: true,
                    olLayer: dummyLayer()
                })
            ]
        });

        const layers = model.layers;
        const b1 = layers.getLayerById("b-1")!;
        const b2 = layers.getLayerById("b-2")!;
        expect(layers.getBaseLayers().length).toBe(2);

        let events = 0;
        syncWatch(
            () => [model!.layers.getLayers()],
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

describe("child access", () => {
    it("it should return all layers including children", async () => {
        const base = createTestLayer({
            type: SimpleLayer,
            id: "base",
            title: "baselayer",
            olLayer: dummyLayer(),
            isBaseLayer: true
        });

        const child = createTestLayer({
            type: SimpleLayer,
            id: "member",
            title: "group member",
            olLayer: dummyLayer()
        });
        const group = createTestLayer({
            type: GroupLayer,
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
        const base = createTestLayer({
            type: SimpleLayer,
            id: "base",
            title: "baselayer",
            olLayer: dummyLayer(),
            isBaseLayer: true
        });

        const child = createTestLayer({
            type: SimpleLayer,
            id: "member",
            title: "group member",
            olLayer: dummyLayer()
        });
        const group = createTestLayer({
            type: GroupLayer,
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
        const base = createTestLayer({
            type: SimpleLayer,
            id: "base",
            title: "baselayer",
            olLayer: dummyLayer(),
            isBaseLayer: true
        });

        const child = createTestLayer({
            type: SimpleLayer,
            id: "member",
            title: "group member",
            olLayer: dummyLayer()
        });
        const group = createTestLayer({
            type: GroupLayer,
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
});

it("supports connecting and disconnecting layers", async () => {
    const simple = createTestLayer({
        type: SimpleLayer,
        title: "Simple",
        olLayer: dummyLayer()
    });
    const group = createTestLayer({
        type: GroupLayer,
        title: "Group",
        layers: [
            createTestLayer({
                type: SimpleLayer,
                title: "Group Child",
                olLayer: dummyLayer()
            })
        ]
    });

    const wmts = createTestLayer(
        {
            type: WMTSLayer,
            title: "foo",
            name: "layer-7328",
            matrixSet: "EPSG:3857",
            url: "https://example.com/wmts-service/Capabilities.xml"
        },
        {
            fetch: throwAbortError
        }
    );
    const wms = createTestLayer(
        {
            type: WMSLayer,
            title: "Layer",
            url: "https://example.com/wms-service",
            sublayers: [
                {
                    name: "sublayer-1",
                    title: "Sublayer 1",
                    sublayers: [
                        {
                            name: "sublayer-2",
                            title: "Sublayer 2"
                        }
                    ]
                }
            ]
        },
        {
            fetch: vi.fn().mockImplementation(async () => new Response("", { status: 200 }))
        }
    );

    // Initially no map
    const layers = [simple, group, wmts, wms];
    expectNoMap(layers);

    // Construct model with given layers, layers are attached
    const map = await create("foo", {
        layers: [simple, group, wmts, wms]
    });
    expectMap(layers, map);

    // Remove again --> layers no longer attached
    for (const layer of layers) {
        map.layers.removeLayer(layer);
    }
    expectNoMap(layers);

    // Attach layers again
    for (const layer of layers) {
        map.layers.addLayer(layer);
    }
    expectMap(layers, map);
});

function expectNoMap(layers: AnyLayer[] | undefined) {
    if (!layers) {
        return;
    }

    for (const layer of layers) {
        expect(() => layer.map, `layer should not have a map: ${layer.title}`).toThrow();
        expectNoMap(layer.children?.getItems());
    }
}

function expectMap(layers: AnyLayer[] | undefined, expectedMap: MapModelImpl) {
    if (!layers) {
        return;
    }

    for (const layer of layers) {
        const actualMap = layer.map;
        expect(actualMap, `layer should have a map: ${layer.title}`).toBe(expectedMap);
        expectMap(layer.children?.getItems(), expectedMap);
    }
}

function getLayerProps(layer: Layer) {
    return {
        title: layer.title,
        description: layer.description,
        visible: layer.visible
    };
}

async function waitForZIndex(layer: Layer) {
    return await waitFor(() => {
        const zIndex = layer?.olLayer.getZIndex();
        if (zIndex == null) {
            throw new Error("No z-index was assigned");
        }
        return zIndex;
    });
}

async function waitForUpdatedZIndex(layer: Layer, oldZIndex?: number) {
    return await waitFor(async () => {
        const currentZIndex = await waitForZIndex(layer);
        if (currentZIndex !== oldZIndex) {
            return currentZIndex;
        } else {
            throw new Error("z-index is unchanged");
        }
    });
}

function getZIndices(layers: Layer[]) {
    const entries = layers.map((layer) => [layer.title, layer.olLayer.getZIndex()]);
    return Object.fromEntries(entries);
}

function create(mapId: string, mapConfig: MapConfig) {
    return createMapModel(mapId, mapConfig, createIntl(), MOCKED_HTTP_SERVICE as HttpService);
}

function dummyLayer() {
    return createTestOlLayer();
}
