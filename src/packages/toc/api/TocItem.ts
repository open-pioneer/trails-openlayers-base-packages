// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch } from "@conterra/reactivity-core";
import { TocLayerNode } from "../new-model/TocLayerNode";
import { ExpandItemOptions } from "./types";

/**
 * Represents an item in the toc.
 *
 * Currently, items register themselves in the model when they are mounted
 * and remove themselves when they are unmounted.
 */
export class TocItem {
    #node: TocLayerNode;

    constructor(node: TocLayerNode) {
        this.#node = node;
    }

    /**
     * Identifier of the Toc item.
     * Currently, this is the same as `layerId`, but that could be changed in the future.
     */
    get id() {
        return this.layerId;
    }

    // internal getter for the layer, not exposed in the TocItem interface
    // in the future, there might be nodes that do not represent a layer
    get #layer() {
        return this.#node.layer;
    }

    /**
     * Identifier of the layer that corresponds with the list item.
     * May be undefined if the item does not represent a layer.
     */
    get layerId() {
        return this.#layer.id;
    }

    /**
     * `true` if list item is expanded.
     */
    get isExpanded() {
        return this.#node.isExpanded;
    }

    /**
     * DOM element of the underlying {@link LayerItem}, `undefined` if the toc has been disposed
     * or if the item is currently not being rendered.
     */
    get htmlElement() {
        return this.#node.htmlElement;
    }

    /**
     * Expands or collapses the list item.
     *
     * Note: not all list items support this operation.
     */
    setExpanded(expanded: boolean, options?: ExpandItemOptions): void {
        batch(() => {
            this.#node.setExpanded(expanded, options?.bubble);
        });
    }
}
