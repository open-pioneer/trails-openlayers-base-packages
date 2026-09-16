// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactiveMap } from "@conterra/reactivity-core";
import { GroupLayer } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer } from "@open-pioneer/map-test-utils";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { describe, expect, it } from "vitest";
import { TocLayerNode } from "./TocLayerNode";
import { SharedData, TocWidgetOptions } from "./TocViewModel";

it("sets children and parent nodes correctly", async () => {
    const { parentNode } = await setup();
    const childNode = parentNode.children[0]!;

    expect(childNode.parent).toBe(parentNode);
    expect(parentNode.children).toHaveLength(1);
    expect(parentNode.children).toContain(childNode);
});

it("bubbles layer visibility only if autoShowParents is true", async () => {
    const { parentNode, sharedData } = await setup({
        widgetOptions: {
            autoShowParents: false,
            collapsibleGroups: true,
            initiallyCollapsed: false
        }
    });
    const childNode = parentNode.children[0]!;
    parentNode.setVisible(false);
    childNode.setVisible(false);

    //initially autoShowParents is false, so parent should not be visible
    childNode.layer.setVisible(true);
    expect(parentNode.isVisible).toBe(false);

    //reset visibility
    parentNode.setVisible(false);
    childNode.setVisible(false);

    //now we set autoShowParents to true, so parent should be visible
    sharedData.options.autoShowParents = true;
    childNode.setVisible(true);
    expect(parentNode.isVisible).toBe(true);
});

it("bubbles expanded state", async () => {
    //setup with nested group
    const { parentNode, sharedData } = await setup({
        parentLayer: createTestLayer({
            type: GroupLayer,
            id: "group-1",
            title: "Group 1",
            layers: [
                createTestLayer({
                    type: GroupLayer,
                    id: "subgroup-1",
                    title: "Subgroup 1",
                    layers: [
                        createTestLayer({
                            id: "subgroup-member-1",
                            title: "Subgroup member 1",
                            olLayer: createTestOlLayer()
                        })
                    ]
                })
            ]
        }),
        widgetOptions: {
            autoShowParents: true,
            collapsibleGroups: true,
            initiallyCollapsed: true //collapse all groups initially
        }
    });
    const subgroupNode = sharedData.nodesById.get("subgroup-1")!;

    //should not bubble
    subgroupNode.setExpanded(true, false);
    expect(subgroupNode.isExpanded).toBeTruthy();
    expect(parentNode.isExpanded).toBeFalsy();
    //should bubble collapse if bubble option explicitly true
    parentNode.setExpanded(true);
    expect(parentNode.isExpanded).toBeTruthy();
    subgroupNode.setExpanded(false, true); //explicit bubble
    expect(subgroupNode.isExpanded).toBeFalsy();
    expect(parentNode.isExpanded).toBeFalsy();
    //should bubble expand implicitly
    subgroupNode.setExpanded(false, true); //reset
    subgroupNode.setExpanded(true); //implicit bubble
    expect(subgroupNode.isExpanded).toBeTruthy();
    expect(parentNode.isExpanded).toBeTruthy();
    //should bubble expand explicitly as well
    subgroupNode.setExpanded(false, true); //reset
    subgroupNode.setExpanded(true, true); //implicit bubble
    expect(subgroupNode.isExpanded).toBeTruthy();
    expect(parentNode.isExpanded).toBeTruthy();
});

describe("issues", () => {
    const NO_ISSUES = { own: [], propagated: [] } as const;

    it("has no issues by default", async () => {
        const { parentNode } = await setup();
        expect(parentNode.issues).toEqual(NO_ISSUES);
        expect(parentNode.children[0]!.issues).toEqual(NO_ISSUES);
    });

    it("reports an error issue if the layer failed to load", async () => {
        const { parentNode, source } = await setupWithBrokenChild();
        const childNode = parentNode.children[0]!;

        source.setState("error");
        expect(childNode.issues).toMatchInlineSnapshot(`
          {
            "own": [
              {
                "kind": "layer-not-available",
                "message": "Source of layer 'child' is in error state",
                "severity": "error",
              },
            ],
            "propagated": [],
          }
        `);

        // and back
        source.setState("ready");
        expect(childNode.issues).toEqual(NO_ISSUES);
        expect(parentNode.issues).toEqual(NO_ISSUES);
    });

    it("reports a generic warning on the parent if a shown child has an error", async () => {
        const { parentNode, source } = await setupWithBrokenChild();

        source.setState("error");
        expect(parentNode.issues).toMatchInlineSnapshot(`
          {
            "own": [
              {
                "kind": "children-not-available",
                "severity": "warning",
              },
            ],
            "propagated": [],
          }
        `);
    });

    it("propagates the child's issues (including the source layer) if the child is not shown", async () => {
        const { parentNode, source } = await setupWithBrokenChild({
            toc: { listMode: "hide-children" }
        });
        const childNode = parentNode.children[0]!;
        expect(childNode.isShown).toBe(false);

        source.setState("error");
        expect(parentNode.issues.own).toEqual([]);
        expect(parentNode.issues.propagated).toEqual([
            {
                kind: "layer-not-available",
                message: "Source of layer 'child' is in error state",
                // Propagated errors are downgraded to warnings
                severity: "warning",
                layer: childNode.layer
            }
        ]);

        // same thing for internal children
        parentNode.layer.updateAttributes({ toc: { listMode: "show" } });
        expect(kinds(parentNode.issues.own)).toEqual(["children-not-available"]);
        expect(parentNode.issues.propagated).toEqual([]);

        childNode.layer.setInternal(true);
        expect(parentNode.issues.own).toEqual([]);
        expect(parentNode.issues.propagated[0]?.layer).toBe(childNode.layer);
    });

    it("bubbles a single generic warning through all shown ancestors", async () => {
        const { parentNode, subgroupNode, source } = await setupNestedGroups();

        source.setState("error");
        expect(kinds(subgroupNode.issues.own)).toEqual(["children-not-available"]);
        expect(kinds(parentNode.issues.own)).toEqual(["children-not-available"]);
        expect(parentNode.issues.propagated).toEqual([]);

        source.setState("ready");
        expect(subgroupNode.issues).toEqual(NO_ISSUES);
        expect(parentNode.issues).toEqual(NO_ISSUES);
    });

    it("propagates issues of the whole hidden subtree to the closest shown ancestor", async () => {
        const { parentNode, subgroupNode, childNode, source } = await setupNestedGroups();
        source.setState("error");

        // The subgroup is hidden: its children cannot be shown either, so the child's issue gets propagated twice.
        subgroupNode.layer.updateAttributes({ toc: { listMode: "hide" } });
        expect(childNode.isShown).toBe(false);
        expect(subgroupNode.issues.own).toEqual([]);
        expect(subgroupNode.issues.propagated.map((i) => i.layer.id)).toEqual(["child"]);
        expect(parentNode.issues.own).toEqual([]);
        expect(parentNode.issues.propagated.map((i) => i.layer.id)).toEqual(["child"]);

        // The subgroup is shown but hides its children: the subgroup shows the propagated issue,
        // the parent only gets the generic flag.
        subgroupNode.layer.updateAttributes({ toc: { listMode: "hide-children" } });
        expect(subgroupNode.issues.own).toEqual([]);
        expect(subgroupNode.issues.propagated.map((i) => i.layer.id)).toEqual(["child"]);
        expect(kinds(parentNode.issues.own)).toEqual(["children-not-available"]);
        expect(parentNode.issues.propagated).toEqual([]);

        // The parent hides its children: the whole subtree is hidden.
        subgroupNode.layer.updateAttributes({ toc: { listMode: "show" } });
        parentNode.layer.updateAttributes({ toc: { listMode: "hide-children" } });
        expect(subgroupNode.isShown).toBe(false);
        expect(parentNode.issues.own).toEqual([]);
        expect(parentNode.issues.propagated.map((i) => i.layer.id)).toEqual(["child"]);
    });

    it("does not propagate infos", async () => {
        const { parentNode, source } = await setupWithBrokenChild({
            toc: { listMode: "hide-children" }
        });
        // 'loading' is not an issue at all, but used here to verify that nothing else leaks
        source.setState("loading");
        expect(parentNode.issues).toEqual(NO_ISSUES);
    });

    function kinds(issues: { kind: string }[]) {
        return issues.map((issue) => issue.kind);
    }
});

async function setup(options?: { widgetOptions?: TocWidgetOptions; parentLayer?: GroupLayer }) {
    const { widgetOptions, parentLayer = createDefaultLayers() } = options ?? {};

    const sharedData: SharedData = {
        nodesById: reactiveMap<string, TocLayerNode>(),
        options: widgetOptions ?? {
            autoShowParents: true,
            collapsibleGroups: true,
            initiallyCollapsed: false
        }
    };

    const parentNode = new TocLayerNode(parentLayer, undefined, sharedData);
    return { parentNode, sharedData };
}

/**
 * ```text
 * group-1
 *   subgroup-1
 *     child (broken via `source`)
 * ```
 */
async function setupNestedGroups() {
    const source = new OSM();
    const { parentNode, sharedData } = await setup({
        parentLayer: createTestLayer({
            type: GroupLayer,
            id: "group-1",
            title: "Group 1",
            layers: [
                createTestLayer({
                    type: GroupLayer,
                    id: "subgroup-1",
                    title: "Subgroup 1",
                    layers: [
                        createTestLayer({
                            id: "child",
                            title: "Child",
                            olLayer: new TileLayer({ source })
                        })
                    ]
                })
            ]
        })
    });
    const subgroupNode = sharedData.nodesById.get("subgroup-1")!;
    const childNode = sharedData.nodesById.get("child")!;
    return { parentNode, subgroupNode, childNode, sharedData, source };
}

async function setupWithBrokenChild(parentAttributes?: Record<string, unknown>) {
    const source = new OSM();
    const result = await setup({
        parentLayer: createTestLayer({
            type: GroupLayer,
            id: "group-1",
            title: "Group 1",
            attributes: parentAttributes,
            layers: [
                createTestLayer({
                    id: "child",
                    title: "Child",
                    olLayer: new TileLayer({ source })
                })
            ]
        })
    });
    return { ...result, source };
}

/**
 * Default layer graph (in configuration order, i.e. bottom to top):
 *
 * ```text
 * layer-1
 * group-1
 *   group-member-1
 * ```
 */
function createDefaultLayers() {
    const childLayer = createTestLayer({
        id: "group-member-1",
        title: "Group member 1",
        olLayer: createTestOlLayer()
    });
    const parentLayer = createTestLayer({
        type: GroupLayer,
        id: "group-1",
        title: "Group 1",
        layers: [childLayer]
    });
    return parentLayer;
}
