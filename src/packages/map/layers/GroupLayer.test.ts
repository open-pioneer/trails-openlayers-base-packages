// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createTestLayer, createTestOlLayer } from "@open-pioneer/map-test-utils";
import { Group } from "ol/layer";
import { expect, it } from "vitest";
import { GroupLayer } from "./GroupLayer";
import { SimpleLayer } from "./SimpleLayer";
import { WMSLayer } from "./WMSLayer";

it("should not have any sublayers", () => {
    const olLayer = createTestOlLayer();
    const grouplayer = createTestLayer({
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
    });
    expect(grouplayer.sublayers).toBeUndefined();
});

it("should create OL group that contains all group members", () => {
    const olLayer1 = createTestOlLayer();
    const olLayer2 = createTestOlLayer();
    const grouplayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [
            createTestLayer({
                type: SimpleLayer,
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            createTestLayer({
                type: GroupLayer,
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        id: "subgroupmember",
                        title: "subgroup member",
                        olLayer: olLayer2
                    })
                ]
            })
        ]
    });

    expect(grouplayer.olLayer instanceof Group).toBeTruthy();
    expect(grouplayer.olLayer.getLayers().getArray()).toContain(olLayer1);
    expect(grouplayer.layers.getLayers()[1]?.olLayer instanceof Group).toBeTruthy(); //subgroup
});

it("should set parent of group members to this group layer", () => {
    const olLayer = createTestOlLayer();
    const child = createTestLayer({
        type: SimpleLayer,
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    expect(child.parent).toBeUndefined();

    const grouplayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [child]
    });
    expect(grouplayer.layers.getLayers()[0]).toBe(child);
    expect(grouplayer.layers).toBe(grouplayer.children); // alias
    expect(child.parent).toBe(grouplayer);

    grouplayer.destroy();
    expect(grouplayer.layers.getLayers().length).toBe(0);
    expect(child.parent).toBeUndefined();
});

it("should return all layers of the group layer collection, including child layers", () => {
    const olLayer1 = createTestOlLayer();
    const olLayer2 = createTestOlLayer();

    const wmsLayer = createTestLayer({
        type: WMSLayer,
        title: "test wms",
        id: "wms",
        sublayers: [
            {
                title: "wms sublayer 1",
                id: "wms_sublayer_1"
            },
            {
                title: "sublayer 2",
                id: "wms_sublayer_2",
                sublayers: [
                    {
                        title: "subsublayer 1",
                        id: "wms_subsublayer_1"
                    }
                ]
            }
        ],
        url: "http://example.com/wms"
    });

    const grouplayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [
            createTestLayer({
                type: SimpleLayer,
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            createTestLayer({
                type: GroupLayer,
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        id: "subgroupmember",
                        title: "subgroup member",
                        olLayer: olLayer2
                    })
                ]
            }),
            wmsLayer
        ]
    });

    const layers = grouplayer.layers.getRecursiveLayers({
        filter: (layer) => layer.title !== "group member"
    });
    const layerIds = layers.map((layer) => layer.id);

    expect(layerIds).toContain("subgroup");
    expect(layerIds).toContain("subgroupmember");
    expect(layerIds).toContain("wms");
    expect(layerIds).toContain("wms_sublayer_1");
    expect(layerIds).toContain("wms_sublayer_2");
    expect(layerIds.includes("member")).toBeFalsy(); //excluded by filter function
    expect(layerIds.includes("group")).toBeFalsy(); //group itself is not part of the group layer collection
});

it("should return internal child layers only if explicitly specified", () => {
    const olLayer1 = createTestOlLayer();
    const olLayer2 = createTestOlLayer();

    const grouplayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [
            createTestLayer({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            createTestLayer({
                id: "internal",
                title: "internal group member",
                olLayer: olLayer2,
                internal: true
            })
        ]
    });

    let childLayers = grouplayer.layers.getLayers();
    expect(childLayers.length).toBe(1);
    childLayers = grouplayer.layers.getLayers({ includeInternalLayers: true });
    expect(childLayers.length).toBe(2);

    childLayers = grouplayer.layers.getItems();
    expect(childLayers.length).toBe(1);
    childLayers = grouplayer.layers.getItems({ includeInternalLayers: true });
    expect(childLayers.length).toBe(2);
});

it("should return internal child layers only if explicitly specified (recursive retrieval)", () => {
    const olLayer1 = createTestOlLayer();
    const olLayer2 = createTestOlLayer();

    const grouplayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [
            createTestLayer({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            createTestLayer({
                type: GroupLayer,
                id: "internal subgroup",
                title: "subgroup test",
                internal: true,
                layers: [
                    createTestLayer({
                        id: "subgroupmember",
                        title: "subgroup member",
                        olLayer: olLayer2
                    })
                ]
            })
        ]
    });

    let childLayers = grouplayer.layers.getRecursiveLayers();
    expect(childLayers.length).toBe(1);

    childLayers = grouplayer.layers.getRecursiveLayers({ includeInternalLayers: true });
    expect(childLayers.length).toBe(3);
});

it("throws when adding the same child twice", () => {
    const olLayer = createTestOlLayer();
    const child = createTestLayer({
        type: SimpleLayer,
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    expect(() =>
        createTestLayer({
            type: GroupLayer,
            id: "group",
            title: "group test",
            layers: [child, child]
        })
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Duplicate item added to a unique collection]`);
});
