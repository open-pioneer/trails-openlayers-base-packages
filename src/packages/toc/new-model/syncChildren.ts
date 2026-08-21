// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Reactive, watchValue } from "@conterra/reactivity-core";
import { Resource, shallowEqual } from "@open-pioneer/core";
import { AnyLayer } from "@open-pioneer/map";
import { TocLayerNode } from "./TocLayerNode";

/**
 * Watches the result of `getLayers()` and creates or reuses child nodes as appropriate.
 * The current list of children is written to `outputNodes`.
 */
export function syncChildren(
    parent: TocLayerNode | undefined,
    nodeIndex: Map<AnyLayer, TocLayerNode>,
    getLayers: () => AnyLayer[],
    outputNodes: Reactive<TocLayerNode[]>
): Resource {
    return watchValue(
        () => getLayers().reverse(),
        (layers) => {
            // TODO: use batch() --> probably multiple signal writes
            const reusedNodes = new Set<TocLayerNode>();
            const createdNodes = new Set<TocLayerNode>();

            const updatedNodes: TocLayerNode[] = [];
            for (const layer of layers) {
                const existingNode = nodeIndex.get(layer);
                if (existingNode) {
                    reusedNodes.add(existingNode);
                    updatedNodes.push(existingNode);
                } else {
                    const node = new TocLayerNode(layer, parent);
                    createdNodes.add(node);
                    updatedNodes.push(node);
                }
            }

            for (const [layer, existingNode] of nodeIndex) {
                if (!reusedNodes.has(existingNode)) {
                    // Node must be removed because it is no longer needed.
                    existingNode.destroy();
                    nodeIndex.delete(layer);
                }
            }

            for (const node of createdNodes) {
                nodeIndex.set(node.layer, node);
            }

            outputNodes.value = updatedNodes;
        },
        {
            equal: shallowEqual,
            immediate: true
        }
    );
}
