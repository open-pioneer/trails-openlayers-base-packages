// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { SimpleLayerImpl } from "./SimpleLayerImpl";
import { GroupLayerImpl } from "./GroupLayerImpl";
import { Group } from "ol/layer";

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
    expect(grouplayer.layers.getLayers()[0]?.parent === grouplayer).toBeTruthy();
});
