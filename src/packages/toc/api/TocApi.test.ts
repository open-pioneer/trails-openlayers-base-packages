// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { GroupLayer } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer, setupMap } from "@open-pioneer/map-test-utils";
import { describe, expect, it, onTestFinished } from "vitest";
import { TocViewModel } from "../model/TocViewModel";
import { LayerTocAttributes } from "../ui/Toc";
import { TocApi } from "./TocApi";
import { TocItem } from "./TocItem";

describe("item lookup", () => {
    it("returns items for layers shown in the toc", async () => {
        const { api } = await setup();

        const item = api.getItemByLayerId("layer-1");
        expect(item).toBeInstanceOf(TocItem);
        expect(item!.id).toBe("layer-1");
        expect(item!.layerId).toBe("layer-1");
        expect(api.getItemById("layer-1")).toBe(item);
    });

    it("returns the same item instance for repeated lookups", async () => {
        const { api } = await setup();
        expect(api.getItemByLayerId("layer-1")).toBe(api.getItemByLayerId("layer-1"));
        expect(api.getItems()).toContain(api.getItemByLayerId("layer-1"));
    });

    it("returns undefined for unknown ids", async () => {
        const { api } = await setup();
        expect(api.getItemById("does-not-exist")).toBeUndefined();
        expect(api.getItemByLayerId("does-not-exist")).toBeUndefined();
    });

    it("does not return items for base layers", async () => {
        const { api } = await setup();
        expect(api.getItemByLayerId("base-layer")).toBeUndefined();
        expect(ids(api.getItems())).not.toContain("base-layer");
    });
});

describe("hidden layers", () => {
    it("only lists items that are shown in the toc", async () => {
        const { api } = await setup();

        // The group hiding its children is shown itself, only its children are hidden.
        expect(ids(api.getItems()).sort()).toEqual([
            "group",
            "group-member",
            "hiding-group",
            "layer-1"
        ]);
    });

    it("does not return items for internal layers", async () => {
        const { api } = await setup();
        expect(api.getItemById("internal-layer")).toBeUndefined();
        expect(api.getItemByLayerId("internal-layer")).toBeUndefined();
    });

    it("does not return items for layers with listMode 'hide'", async () => {
        const { api } = await setup();
        expect(api.getItemById("hidden-layer")).toBeUndefined();
        expect(api.getItemByLayerId("hidden-layer")).toBeUndefined();
    });

    it("does not return items for children of a group with listMode 'hide-children'", async () => {
        const { api } = await setup();
        expect(api.getItemByLayerId("hiding-group")).toBeDefined();
        expect(api.getItemByLayerId("hidden-member")).toBeUndefined();
    });

    it("reflects changes of the layer's toc attributes", async () => {
        const { map, api } = await setup();
        const layer = map.layers.getLayerById("layer-1")!;
        expect(api.getItemByLayerId("layer-1")).toBeDefined();

        layer.updateAttributes({ toc: { listMode: "hide" } satisfies LayerTocAttributes });
        expect(api.getItemByLayerId("layer-1")).toBeUndefined();
        expect(ids(api.getItems())).not.toContain("layer-1");

        layer.updateAttributes({ toc: { listMode: "show" } satisfies LayerTocAttributes });
        expect(api.getItemByLayerId("layer-1")).toBeDefined();
        expect(ids(api.getItems())).toContain("layer-1");
    });
});

function ids(items: TocItem[]): string[] {
    return items.map((item) => item.id);
}

/**
 * Layer graph (bottom to top):
 *
 * ```text
 * base-layer (base layer)
 * layer-1
 * internal-layer (internal)
 * hidden-layer (listMode: "hide")
 * group
 *   group-member
 * hiding-group (listMode: "hide-children")
 *   hidden-member
 * ```
 */
async function setup() {
    const { map } = await setupMap({
        layers: [
            {
                id: "base-layer",
                title: "Base layer",
                isBaseLayer: true,
                olLayer: createTestOlLayer()
            },
            {
                id: "layer-1",
                title: "Layer 1",
                olLayer: createTestOlLayer()
            },
            {
                id: "internal-layer",
                title: "Internal layer",
                internal: true,
                olLayer: createTestOlLayer()
            },
            {
                id: "hidden-layer",
                title: "Hidden layer",
                attributes: { toc: { listMode: "hide" } satisfies LayerTocAttributes },
                olLayer: createTestOlLayer()
            },
            createTestLayer({
                type: GroupLayer,
                id: "group",
                title: "Group",
                layers: [
                    createTestLayer({
                        id: "group-member",
                        title: "Group member",
                        olLayer: createTestOlLayer()
                    })
                ]
            }),
            createTestLayer({
                type: GroupLayer,
                id: "hiding-group",
                title: "Hiding group",
                attributes: { toc: { listMode: "hide-children" } satisfies LayerTocAttributes },
                layers: [
                    createTestLayer({
                        id: "hidden-member",
                        title: "Hidden member",
                        olLayer: createTestOlLayer()
                    })
                ]
            })
        ]
    });
    const viewModel = new TocViewModel(map, {
        autoShowParents: true,
        collapsibleGroups: false,
        initiallyCollapsed: false
    });
    onTestFinished(() => {
        viewModel.destroy();
        map.destroy();
    });
    const api = new TocApi(viewModel);
    return { map, viewModel, api };
}
