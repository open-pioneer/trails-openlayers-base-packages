// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactiveMap } from "@conterra/reactivity-core";
import { GroupLayer } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer, setupMap } from "@open-pioneer/map-test-utils";
import { expect, it } from "vitest";
import { TocLayerNode } from "./TocLayerNode";
import { SharedData, TocWidgetOptions } from "./TocViewModel";

it("sets children and parent nodes correctly", async () => {
    const { parentNode, childNode } = await setup();

    expect(childNode.parent).toBe(parentNode);
    expect(parentNode.children).toHaveLength(1);
    expect(parentNode.children).toContain(childNode);
});

async function setup(options?: { widgetOptions?: TocWidgetOptions }) {
    const { parentLayer } = createDefaultLayers();

    const { map } = await setupMap({
        layers: [parentLayer]
    });

    const sharedData: SharedData = {
        nodesById: reactiveMap<string, TocLayerNode>(),
        options: options?.widgetOptions ?? {
            autoShowParents: true,
            collapsibleGroups: true,
            initiallyCollapsed: false
        }
    };

    const parentNode = new TocLayerNode(parentLayer, undefined, sharedData);
    const childNode = parentNode.children[0]!;

    return { childNode, parentNode, map };
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
