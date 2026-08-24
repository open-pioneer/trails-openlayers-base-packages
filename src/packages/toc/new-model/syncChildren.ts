// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch, reactive, Reactive, watchValue } from "@conterra/reactivity-core";
import { Resource, shallowEqual } from "@open-pioneer/core";
import { AnyLayer } from "@open-pioneer/map";
import { TocLayerNode } from "./TocLayerNode";
import { SharedData } from "./TocViewModel";

export interface NodeChildren {
    /// The collection of child nodes, keyed by the layer they represent.
    /// NOTE: currently not reactive (not needed).
    index: Map<AnyLayer, TocLayerNode>;

    /// Same items as in `index`, but in their display order.
    order: Reactive<TocLayerNode[]>;
}

export function createNodeChildren(): NodeChildren {
    const index = new Map();
    const order = reactive([]);
    return {
        index,
        order
    };
}

export interface SyncChildrenOptions {
    /** The parent node, whose children are being synced. */
    parent: TocLayerNode | undefined;

    /** Shared global data, passed to each node. */
    shared: SharedData;

    /** Returns the current set of child layers. */
    getLayers: () => AnyLayer[];

    /** Output object: this is rewritten whenever the layers change. */
    children: NodeChildren;
}

/**
 * Watches the result of `getLayers()` and creates or reuses child nodes as appropriate.
 * The current list of children is written to `outputNodes`.
 *
 * Performance: this algorithm recreates the child node array of a layer node whenever that layer's set of child layers
 * changes in the map. However, preexisting nodes from the last version are reused.
 * The performance for this _should_ be okay: even a layer with hundreds of children, which might get reordered,
 * will only recreate an array of moderate size, reusing all nodes from before.
 */
// TODO: Refactor into class
export function syncChildren({
    parent,
    shared,
    getLayers,
    children
}: SyncChildrenOptions): Resource {
    let watchHandle: Resource | undefined = watchValue(
        () => getLayers().reverse(),
        (layers) => {
            // NOTE: one large batch because the individual node constructors have side effects,
            // they register themselves in the global node lookup index.
            batch(() => {
                const nodeIndex = children.index;
                const nodeOrder = children.order;

                // NOTE: obsolete nodes are destroyed _before_ any new node is created.
                // New nodes register themselves (and their children) in the global node index,
                // which would otherwise conflict with the not-yet-destroyed nodes for the same ids.
                const newLayers = new Set(layers);
                for (const [layer, existingNode] of nodeIndex) {
                    if (!newLayers.has(layer)) {
                        // Node must be removed because it is no longer needed.
                        existingNode.destroy();
                        nodeIndex.delete(layer);
                    }
                }

                const newNodeOrder: TocLayerNode[] = [];
                for (const layer of layers) {
                    let node = nodeIndex.get(layer);
                    if (!node) {
                        node = new TocLayerNode(layer, parent, shared);
                        nodeIndex.set(layer, node);
                    }
                    newNodeOrder.push(node);
                }

                nodeOrder.value = newNodeOrder;
            });
        },
        {
            equal: shallowEqual,
            immediate: true
        }
    );

    let destroyed = false;
    return {
        destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            watchHandle?.destroy();
            watchHandle = undefined;
            batch(() => {
                for (const childNode of children.index.values()) {
                    childNode.destroy();
                }

                children.index.clear();
                children.order.value = [];
            });
        }
    };
}
