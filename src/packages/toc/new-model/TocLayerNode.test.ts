// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactiveMap } from "@conterra/reactivity-core";
import { GroupLayer } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer } from "@open-pioneer/map-test-utils";
import { expect, it } from "vitest";
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

async function setup(options?: { widgetOptions?: TocWidgetOptions; parentLayer?: GroupLayer }) {
    const { parentLayer } = options?.parentLayer
        ? { parentLayer: options.parentLayer }
        : createDefaultLayers();

    //Do we actually need to setup the MapModel?
    /*     const { map } = await setupMap({
        layers: [parentLayer]
    }); */

    const sharedData: SharedData = {
        nodesById: reactiveMap<string, TocLayerNode>(),
        options: options?.widgetOptions ?? {
            autoShowParents: true,
            collapsibleGroups: true,
            initiallyCollapsed: false
        }
    };

    const parentNode = new TocLayerNode(parentLayer, undefined, sharedData);

    return { parentNode, sharedData };
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

    return { parentLayer, childLayer };
}
