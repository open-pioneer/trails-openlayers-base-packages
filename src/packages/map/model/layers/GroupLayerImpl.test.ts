// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { SimpleLayerImpl } from "./SimpleLayerImpl";
import { GroupLayerImpl } from "./GroupLayerImpl";
import { Group } from "ol/layer";
import { WMSLayer } from "../../api";

it("should not have any sublayers", () => {
    const olLayer = new TileLayer({});
    const grouplayer = new GroupLayerImpl({
        id: "group",
        title: "group test",
        layers: [
            new SimpleLayerImpl({
                id: "member",
                title: "group member",
                olLayer: olLayer
            })
        ]
    });
    expect(grouplayer.sublayers).toBeUndefined();
});

it("should create OL group that contains all group members", () => {
    const olLayer1 = new TileLayer({});
    const olLayer2 = new TileLayer({});
    const grouplayer = new GroupLayerImpl({
        id: "group",
        title: "group test",
        layers: [
            new SimpleLayerImpl({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            new GroupLayerImpl({
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    new SimpleLayerImpl({
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
    const olLayer = new TileLayer({});
    const child = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    expect(child.parent).toBeUndefined();

    const grouplayer = new GroupLayerImpl({
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
    const olLayer1 = new TileLayer({});
    const olLayer2 = new TileLayer({});

    const wmsLayer = new WMSLayer({
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

    const grouplayer = new GroupLayerImpl({
        id: "group",
        title: "group test",
        layers: [
            new SimpleLayerImpl({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            new GroupLayerImpl({
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    new SimpleLayerImpl({
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
        filter: (layer) => layer.title !== "group member",
        excludeParentLayers: true
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

it("throws when adding the same child twice", () => {
    const olLayer = new TileLayer({});
    const child = new SimpleLayerImpl({
        id: "member",
        title: "group member",
        olLayer: olLayer
    });
    expect(
        () =>
            new GroupLayerImpl({
                id: "group",
                title: "group test",
                layers: [child, child]
            })
    ).toThrowErrorMatchingInlineSnapshot(`[Error: Duplicate item added to a unique collection]`);
});
