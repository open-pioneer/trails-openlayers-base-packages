// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch, computed, nextTick } from "@conterra/reactivity-core";
import { AnyLayer, GroupLayer, isLayer, Layer } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer, setupMap } from "@open-pioneer/map-test-utils";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { TocLayerNode } from "./TocLayerNode";
import { TocViewModel, TocWidgetOptions } from "./TocViewModel";

describe("node structure", () => {
    it("reflects the layers of the map", async () => {
        const { model } = await setup();

        // Topmost layer first (display order). This is the reverse order when compared to the map,
        expect(dumpTree(model)).toMatchInlineSnapshot(`
          [
            "group",
            "  subgroup",
            "    subgroup-member",
            "  group-member",
            "layer-1",
          ]
        `);
    });

    it("does not include base layers", async () => {
        const { model } = await setup();
        expect(model.getNodeById("base-layer")).toBeUndefined();
        expect(ids(model.children)).not.toContain("base-layer");
    });

    it("creates nodes for internal layers, but hides them", async () => {
        const { model } = await setup({
            layers: [
                createTestLayer({
                    id: "internal-layer",
                    title: "Internal layer",
                    internal: true,
                    olLayer: createTestOlLayer()
                })
            ]
        });

        const node = model.getNodeById("internal-layer");
        expect(node).toBeDefined();
        expect(node!.show).toBe(false);
    });
});

describe("synchronization", () => {
    it("creates a node when a layer is added to the map", async () => {
        const { map, model } = await setup();
        expect(ids(model.children)).toEqual(["group", "layer-1"]);

        map.layers.addLayer(
            createTestLayer({
                id: "layer-2",
                title: "Layer 2",
                olLayer: createTestOlLayer()
            })
        );
        await vi.waitFor(() => {
            // New layers are added on top, i.e. at the front of the toc.
            expect(ids(model.children)).toEqual(["layer-2", "group", "layer-1"]);
            expect(model.getNodeById("layer-2")).toBeDefined();
        });
    });

    it("removes the node when a layer is removed from the map", async () => {
        const { map, model } = await setup();

        map.layers.removeLayer("layer-1");
        await vi.waitFor(() => {
            expect(ids(model.children)).toEqual(["group"]);
            expect(model.getNodeById("layer-1")).toBeUndefined();
        });
    });

    it("reuses existing nodes for unchanged layers", async () => {
        const { map, model } = await setup();
        const groupNode = model.getNodeById("group")!;
        const memberNode = model.getNodeById("subgroup-member")!;

        map.layers.addLayer(
            createTestLayer({
                id: "layer-2",
                title: "Layer 2",
                olLayer: createTestOlLayer()
            })
        );
        await vi.waitFor(() => {
            expect(model.getNodeById("layer-2")).toBeDefined();
        });

        // The nodes of the unchanged layers are the same objects as before.
        expect(model.getNodeById("group")).toBe(groupNode);
        expect(model.getNodeById("subgroup-member")).toBe(memberNode);
    });

    it("removes nested nodes when their parent layer is removed", async () => {
        const { map, model } = await setup();
        const memberNode = model.getNodeById("subgroup-member")!;
        expect(memberNode).toBeDefined();

        map.layers.removeLayer("group");
        await vi.waitFor(() => {
            expect(ids(model.children)).toEqual(["layer-1"]);
            expect(model.getNodeById("group")).toBeUndefined();
            expect(model.getNodeById("subgroup")).toBeUndefined();
            expect(model.getNodeById("subgroup-member")).toBeUndefined();
        });
    });

    it("indexes the new node when a layer is replaced by a layer with the same id", async () => {
        const { map, model } = await setup();

        batch(() => {
            map.layers.removeLayer("layer-1");
            map.layers.addLayer(
                createTestLayer({
                    id: "layer-1",
                    title: "Layer 1 (new)",
                    olLayer: createTestOlLayer()
                })
            );
        });

        await vi.waitFor(() => {
            const node = model.children.find((child) => child.id === "layer-1");
            expect(node).toBeDefined();
            expect(node!.layer.title).toBe("Layer 1 (new)");
            expect(model.getNodeById("layer-1")).toBe(node);
        });
    });

    it("indexes the new nodes when a group layer is replaced by a group with the same ids", async () => {
        const { map, model } = await setup();

        batch(() => {
            map.layers.removeLayer("group");
            map.layers.addLayer(
                createTestLayer({
                    type: GroupLayer,
                    id: "group",
                    title: "Group (new)",
                    layers: [
                        createTestLayer({
                            id: "group-member",
                            title: "Group member (new)",
                            olLayer: createTestOlLayer()
                        })
                    ]
                })
            );
        });
        await vi.waitFor(() => {
            const groupNode = model.children.find((child) => child.id === "group");
            expect(groupNode).toBeDefined();
            expect(groupNode!.layer.title).toBe("Group (new)");
            expect(model.getNodeById("group")).toBe(groupNode);

            const memberNode = groupNode!.children.find((child) => child.id === "group-member");
            expect(memberNode).toBeDefined();
            expect(memberNode!.layer.title).toBe("Group member (new)");
            expect(model.getNodeById("group-member")).toBe(memberNode);
        });
    });
});

describe("global node index", () => {
    it("contains an entry for every node in the tree", async () => {
        const { model } = await setup();

        const nodes = collectNodes(model);
        expect(ids(nodes)).toEqual([
            "group",
            "subgroup",
            "subgroup-member",
            "group-member",
            "layer-1"
        ]);
        for (const node of nodes) {
            expect(model.getNodeById(node.id), `node '${node.id}' is indexed`).toBe(node);
        }
    });

    it("indexes nodes by their layer id", async () => {
        const { model } = await setup();
        const node = model.getNodeById("subgroup-member")!;
        expect(node.id).toBe("subgroup-member");
        expect(node.layer.id).toBe("subgroup-member");
    });

    it("returns undefined for unknown ids", async () => {
        const { model } = await setup();
        expect(model.getNodeById("does-not-exist")).toBeUndefined();
    });
});

describe("parent / child links", () => {
    it("does not set a parent on top level nodes", async () => {
        const { model } = await setup();
        for (const node of model.children) {
            expect(node.parent).toBeUndefined();
        }
    });

    it("links child nodes to their parent node", async () => {
        const { model } = await setup();
        const group = model.getNodeById("group")!;
        const subgroup = model.getNodeById("subgroup")!;
        const member = model.getNodeById("subgroup-member")!;

        expect(group.parent).toBeUndefined();
        expect(subgroup.parent).toBe(group);
        expect(member.parent).toBe(subgroup);
    });

    it("keeps parent and children consistent", async () => {
        const { model } = await setup();
        for (const node of collectNodes(model)) {
            for (const child of node.children) {
                expect(child.parent).toBe(node);
            }
            const siblings = node.parent ? node.parent.children : model.children;
            expect(siblings).toContain(node);
        }
    });
});

describe("widget options", () => {
    it("exposes the options to all nodes", async () => {
        const { model } = await setup();

        expect(model.options).toMatchObject(DEFAULT_OPTIONS);
        for (const node of collectNodes(model)) {
            expect(node.options, `options of node '${node.id}'`).toBe(model.options);
        }
    });

    it("propagates new options to existing nodes", async () => {
        const { model } = await setup();
        const node = model.getNodeById("subgroup-member")!;

        model.setOptions({ ...DEFAULT_OPTIONS, autoShowParents: false });

        expect(model.options.autoShowParents).toBe(false);
        expect(node.options.autoShowParents).toBe(false);
    });

    it("makes option changes visible to reactive consumers", async () => {
        const { model } = await setup({ options: { collapsibleGroups: true } });
        const node = model.getNodeById("group")!;
        node.setExpanded(false);

        const isExpanded = computed(() => node.isExpanded);
        expect(isExpanded.value).toBe(false);

        // Groups can no longer be collapsed, so every node counts as expanded.
        model.setOptions({ ...DEFAULT_OPTIONS, collapsibleGroups: false });
        expect(isExpanded.value).toBe(true);
    });
});

describe("expansion", () => {
    it("expands all nodes by default", async () => {
        const { model } = await setup({ options: { collapsibleGroups: true } });
        for (const node of collectNodes(model)) {
            expect(node.isExpanded, `node '${node.id}' is expanded`).toBe(true);
        }
    });

    it("collapses all nodes if `initiallyCollapsed` is enabled", async () => {
        const { model } = await setup({
            options: { collapsibleGroups: true, initiallyCollapsed: true }
        });
        for (const node of collectNodes(model)) {
            expect(node.isExpanded, `node '${node.id}' is collapsed`).toBe(false);
        }
    });

    it("reports all nodes as expanded if `collapsibleGroups` is disabled", async () => {
        const { model } = await setup({
            options: { collapsibleGroups: false, initiallyCollapsed: true }
        });
        const node = model.getNodeById("group")!;
        expect(node.isExpanded).toBe(true);

        node.setExpanded(false);
        expect(node.isExpanded).toBe(true);
    });

    it("expands the parent nodes when a node is expanded", async () => {
        const { model } = await setup({
            options: { collapsibleGroups: true, initiallyCollapsed: true }
        });

        model.getNodeById("subgroup-member")!.setExpanded(true);
        expect(expansions(model)).toEqual({
            "group": true,
            "subgroup": true,
            "subgroup-member": true,
            "group-member": false,
            "layer-1": false
        });
    });

    it("does not collapse the parent nodes when a node is collapsed", async () => {
        const { model } = await setup({ options: { collapsibleGroups: true } });

        model.getNodeById("subgroup-member")!.setExpanded(false);
        expect(expansions(model)).toEqual({
            "group": true,
            "subgroup": true,
            "subgroup-member": false,
            "group-member": true,
            "layer-1": true
        });
    });

    it("collapses the parent nodes if `bubble` is explicitly enabled", async () => {
        const { model } = await setup({ options: { collapsibleGroups: true } });

        model.getNodeById("subgroup-member")!.setExpanded(false, true);
        expect(expansions(model)).toEqual({
            "group": false,
            "subgroup": false,
            "subgroup-member": false,
            "group-member": true,
            "layer-1": true
        });
    });

    it("does not expand the parent nodes if `bubble` is explicitly disabled", async () => {
        const { model } = await setup({
            options: { collapsibleGroups: true, initiallyCollapsed: true }
        });

        model.getNodeById("subgroup-member")!.setExpanded(true, false);
        expect(expansions(model)).toEqual({
            "group": false,
            "subgroup": false,
            "subgroup-member": true,
            "group-member": false,
            "layer-1": false
        });
    });
});

describe("destruction", () => {
    it("removes all children", async () => {
        const { model } = await setup();
        expect(model.children.length).toBeGreaterThan(0);

        model.destroy();
        expect(model.children).toEqual([]);
    });

    it("removes all nodes from the global index", async () => {
        const { model } = await setup();
        const nodes = collectNodes(model);

        model.destroy();
        for (const node of nodes) {
            expect(model.getNodeById(node.id), `node '${node.id}' is unregistered`).toBeUndefined();
        }
    });

    it("stops listening for layer changes", async () => {
        const { map, model } = await setup();
        model.destroy();

        map.layers.addLayer(
            createTestLayer({
                id: "layer-2",
                title: "Layer 2",
                olLayer: createTestOlLayer()
            })
        );

        await nextTick();
        expect(model.children).toEqual([]);
        expect(model.getNodeById("layer-2")).toBeUndefined();
    });

    it("can be destroyed multiple times", async () => {
        const { model } = await setup();
        model.destroy();
        expect(() => model.destroy()).not.toThrow();
    });
});

const DEFAULT_OPTIONS: TocWidgetOptions = {
    autoShowParents: true,
    collapsibleGroups: false,
    initiallyCollapsed: false
};

/**
 * Creates a map and a toc view model on top of it.
 */
async function setup(config?: { layers?: Layer[]; options?: Partial<TocWidgetOptions> }) {
    const { map } = await setupMap({
        layers: config?.layers ?? createDefaultLayers()
    });
    const model = new TocViewModel(map, { ...DEFAULT_OPTIONS, ...config?.options });
    onTestFinished(() => {
        model.destroy();
        map.destroy();
    });
    return { map, model };
}

/**
 * Default layer graph (in configuration order, i.e. bottom to top):
 *
 * ```text
 * base-layer (base layer)
 * layer-1
 * group
 *   group-member
 *   subgroup
 *     subgroup-member
 * ```
 */
function createDefaultLayers() {
    return [
        createTestLayer({
            id: "base-layer",
            title: "Base layer",
            isBaseLayer: true,
            olLayer: createTestOlLayer()
        }),
        createTestLayer({
            id: "layer-1",
            title: "Layer 1",
            olLayer: createTestOlLayer()
        }),
        createTestLayer({
            type: GroupLayer,
            id: "group",
            title: "Group",
            layers: [
                createTestLayer({
                    id: "group-member",
                    title: "Group member",
                    olLayer: createTestOlLayer()
                }),
                createTestLayer({
                    type: GroupLayer,
                    id: "subgroup",
                    title: "Subgroup",
                    layers: [
                        createTestLayer({
                            id: "subgroup-member",
                            title: "Subgroup member",
                            olLayer: createTestOlLayer()
                        })
                    ]
                })
            ]
        })
    ];
}

/** Maps node id -> `isExpanded`, for all nodes in the tree. */
function expansions(model: TocViewModel): Record<string, boolean> {
    return Object.fromEntries(collectNodes(model).map((node) => [node.id, node.isExpanded]));
}

/**
 * Ids of the given nodes.
 */
function ids(nodes: readonly TocLayerNode[]): string[] {
    return nodes.filter((node) => !isPrivateLayer(node.layer)).map((node) => node.id);
}

/** Returns all nodes of the tree (depth first). */
function collectNodes(model: TocViewModel): TocLayerNode[] {
    const nodes: TocLayerNode[] = [];
    const visit = (node: TocLayerNode) => {
        if (isPrivateLayer(node.layer)) {
            return;
        }
        nodes.push(node);
        node.children.forEach(visit);
    };
    model.children.forEach(visit);
    return nodes;
}

/** Renders the node tree as indented lines for snapshot testing. */
function dumpTree(model: TocViewModel): string[] {
    const lines: string[] = [];
    const visit = (node: TocLayerNode, indent: string) => {
        if (isPrivateLayer(node.layer)) {
            return;
        }
        lines.push(`${indent}${node.id}`);
        node.children.forEach((child) => visit(child, `${indent}  `));
    };
    model.children.forEach((node) => visit(node, ""));
    return lines;
}

/**
 * Skip the highlight layer created by the map model.
 * This layer has a random UUID id, which makes the tests unpredictable.
 *
 * NOTE: We cannot detect this layer well right now, see https://github.com/open-pioneer/trails-openlayers-base-packages/issues/527
 */
function isPrivateLayer(layer: AnyLayer) {
    return isLayer(layer) && layer.olLayer.getClassName().includes("highlight-layer");
}
