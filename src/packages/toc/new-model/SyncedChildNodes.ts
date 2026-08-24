// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch, reactive, Reactive, watchValue } from "@conterra/reactivity-core";
import { destroyResource, Resource, shallowEqual } from "@open-pioneer/core";
import { AnyLayer } from "@open-pioneer/map";
import { TocLayerNode } from "./TocLayerNode";

export interface SyncedChildOptions {
    /**
     * Constructs an new child, properly linked with its parent.
     */
    createChildNode: (layer: AnyLayer) => TocLayerNode;

    /** Returns the current set of child layers. */
    getLayers?: (() => AnyLayer[]) | undefined;
}

/**
 * Watches the result of `getLayers()` and creates or reuses child nodes as appropriate in order to keep their state.
 *
 * Performance: this algorithm recreates the child node array of a layer node whenever that layer's set of child layers
 * changes in the map. However, preexisting nodes from the last version are reused.
 * The performance for this _should_ be okay: even a layer with hundreds of children, which might get reordered,
 * will only recreate an array of moderate size, reusing all nodes from before.
 */
export class SyncedChildNodes implements Resource {
    readonly #createChildNode: (layer: AnyLayer) => TocLayerNode;
    readonly #getLayers: (() => AnyLayer[]) | undefined;
    readonly #children = createNodeChildren();

    #destroyed = false;
    #watchHandle: Resource | undefined;

    constructor(options: SyncedChildOptions) {
        this.#createChildNode = options.createChildNode;
        this.#getLayers = options.getLayers;
        this.#watchHandle = this.#watchChildren();
    }

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        this.#watchHandle = destroyResource(this.#watchHandle);
        batch(() => {
            for (const childNode of this.#children.index.values()) {
                childNode.destroy();
            }

            this.#children.index.clear();
            this.#children.order.value = [];
        });
    }

    /**
     * Returns the current set of children, in display order.
     */
    get children(): TocLayerNode[] {
        return this.#children.order.value;
    }

    #watchChildren() {
        const getLayers = this.#getLayers;
        if (getLayers == null) {
            return undefined;
        }

        const createChildNode = this.#createChildNode;
        const children = this.#children;
        return watchValue(
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
                            node = createChildNode(layer);
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
    }
}

interface NodeChildren {
    /// The collection of child nodes, keyed by the layer they represent.
    /// NOTE: currently not reactive (not needed).
    index: Map<AnyLayer, TocLayerNode>;

    /// Same items as in `index`, but in their display order.
    order: Reactive<TocLayerNode[]>;
}

function createNodeChildren(): NodeChildren {
    const index = new Map();
    const order = reactive([]);
    return {
        index,
        order
    };
}
