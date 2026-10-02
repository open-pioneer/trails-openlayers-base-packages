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

// NOTE: node structure, parent / child links and the expansion logic
// are covered by the view model tests (TocViewModel.test.ts).

describe("visibility", () => {
    it("shows the parent when a child is shown if autoShowParents is true", () => {
        const { parentNode } = setup({ widgetOptions: { autoShowParents: true } });
        const childNode = parentNode.children[0]!;
        parentNode.setVisible(false);
        childNode.setVisible(false);

        childNode.setVisible(true);
        expect(childNode.isVisible).toBe(true);
        expect(parentNode.isVisible).toBe(true);
    });

    it("does not show the parent when a child is shown if autoShowParents is false", () => {
        const { parentNode } = setup({ widgetOptions: { autoShowParents: false } });
        const childNode = parentNode.children[0]!;
        parentNode.setVisible(false);
        childNode.setVisible(false);

        childNode.setVisible(true);
        expect(childNode.isVisible).toBe(true);
        expect(parentNode.isVisible).toBe(false);
    });

    it("never changes the parent's visibility when a child is hidden", () => {
        const { parentNode } = setup({ widgetOptions: { autoShowParents: true } });
        const childNode = parentNode.children[0]!;
        parentNode.setVisible(true);
        childNode.setVisible(true);

        childNode.setVisible(false);
        expect(childNode.isVisible).toBe(false);
        expect(parentNode.isVisible).toBe(true);
    });
});

describe("isShown", () => {
    it("is true by default", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        expect(parentNode.isShown).toBe(true);
        expect(childNode.isShown).toBe(true);
    });

    it("is false if the layer's listMode is 'hide'", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        childNode.layer.updateAttributes({ toc: { listMode: "hide" } });
        expect(childNode.isShown).toBe(false);
    });

    it("is false if the layer is internal", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        childNode.layer.setInternal(true);
        expect(childNode.isShown).toBe(false);
    });

    it("is true if the layer is internal but listMode explicitly overrides it", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        childNode.layer.setInternal(true);
        childNode.layer.updateAttributes({ toc: { listMode: "show" } });
        expect(childNode.isShown).toBe(true);
    });

    it("is false if the parent does not show its children", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        parentNode.layer.updateAttributes({ toc: { listMode: "hide-children" } });
        expect(childNode.isShown).toBe(false);

        // and also if the parent itself is hidden
        parentNode.layer.updateAttributes({ toc: { listMode: "hide" } });
        expect(childNode.isShown).toBe(false);
    });
});

describe("shouldShowChildren", () => {
    it("is true by default", () => {
        const { parentNode } = setup();
        expect(parentNode.shouldShowChildren).toBe(true);
    });

    it("is false if the node itself is not shown", () => {
        const { parentNode } = setup();

        parentNode.layer.updateAttributes({ toc: { listMode: "hide" } });
        expect(parentNode.isShown).toBe(false);
        expect(parentNode.shouldShowChildren).toBe(false);
    });

    it("is false if listMode is 'hide-children'", () => {
        const { parentNode } = setup();

        parentNode.layer.updateAttributes({ toc: { listMode: "hide-children" } });
        expect(parentNode.isShown).toBe(true);
        expect(parentNode.shouldShowChildren).toBe(false);
    });
});

describe("shownChildren and hasShownChildren", () => {
    it("contains all children by default", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        expect(parentNode.shownChildren).toEqual([childNode]);
        expect(parentNode.hasShownChildren).toBe(true);
    });

    it("is empty if the node has no children", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        expect(childNode.shownChildren).toEqual([]);
        expect(childNode.hasShownChildren).toBe(false);
    });

    it("excludes children that are not shown themselves", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        childNode.layer.updateAttributes({ toc: { listMode: "hide" } });
        expect(parentNode.shownChildren).toEqual([]);
        expect(parentNode.hasShownChildren).toBe(false);
    });

    it("is empty if the listMode  is 'hide-children'", () => {
        const { parentNode } = setup();
        const childNode = parentNode.children[0]!;

        parentNode.layer.updateAttributes({ toc: { listMode: "hide-children" } });
        expect(childNode.isShown).toBe(false); // sanity check
        expect(parentNode.shownChildren).toEqual([]);
        expect(parentNode.hasShownChildren).toBe(false);
    });
});

describe("issues", () => {
    const NO_ISSUES = { own: [], propagated: [] } as const;

    it("has no issues by default", () => {
        const { parentNode } = setup();
        expect(parentNode.issues).toEqual(NO_ISSUES);
        expect(parentNode.children[0]!.issues).toEqual(NO_ISSUES);
    });

    it("reports an error issue if the layer failed to load", () => {
        const { parentNode, source } = setupWithBrokenChild();
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

    it("reports a generic warning on the parent if a shown child has an error", () => {
        const { parentNode, source } = setupWithBrokenChild();

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

    it("propagates the child's issues (including the source layer) if the child is not shown", () => {
        const { parentNode, source } = setupWithBrokenChild({
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

    it("bubbles a single generic warning through all shown ancestors", () => {
        const { parentNode, subgroupNode, source } = setupNestedGroups();

        source.setState("error");
        expect(kinds(subgroupNode.issues.own)).toEqual(["children-not-available"]);
        expect(kinds(parentNode.issues.own)).toEqual(["children-not-available"]);
        expect(parentNode.issues.propagated).toEqual([]);

        source.setState("ready");
        expect(subgroupNode.issues).toEqual(NO_ISSUES);
        expect(parentNode.issues).toEqual(NO_ISSUES);
    });

    it("propagates issues of the whole hidden subtree to the closest shown ancestor", () => {
        const { parentNode, subgroupNode, childNode, source } = setupNestedGroups();
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

    it("does not propagate infos", () => {
        const { parentNode, source } = setupWithBrokenChild({
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

const DEFAULT_OPTIONS: TocWidgetOptions = {
    autoShowParents: true,
    collapsibleGroups: true,
    initiallyCollapsed: false
};

function setup(options?: { widgetOptions?: Partial<TocWidgetOptions>; parentLayer?: GroupLayer }) {
    const { widgetOptions, parentLayer = createDefaultLayers() } = options ?? {};

    const sharedData: SharedData = {
        nodesById: reactiveMap<string, TocLayerNode>(),
        options: { ...DEFAULT_OPTIONS, ...widgetOptions }
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
function setupNestedGroups() {
    const source = new OSM();
    const { parentNode, sharedData } = setup({
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

function setupWithBrokenChild(parentAttributes?: Record<string, unknown>) {
    const source = new OSM();
    const result = setup({
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
