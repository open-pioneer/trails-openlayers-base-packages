// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type TocLayerNode } from "../model/TocLayerNode";
import { type ExpandItemOptions } from "./types";

/**
 * Represents an item in the toc.
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
    get id(): string {
        return this.#layer.id;
    }

    /**
     * Identifier of the layer that corresponds with the list item.
     *
     * May be undefined if the item does not represent a layer.
     */
    get layerId(): string | undefined {
        return this.#layer.id;
    }

    /**
     * `true` if list item is expanded.
     */
    get isExpanded(): boolean {
        return this.#node.isExpanded;
    }

    /**
     * DOM element of the underlying {@link LayerItem}, `undefined` if the toc has been disposed
     * or if the item is currently not being rendered.
     */
    get htmlElement(): HTMLElement | undefined {
        return this.#node.htmlElement;
    }

    // internal getter for the layer, not exposed in the TocItem interface
    // in the future, there might be nodes that do not represent a layer
    get #layer() {
        return this.#node.layer;
    }

    /**
     * Expands or collapses the list item.
     *
     * Note: not all list items support this operation.
     */
    setExpanded(expanded: boolean, options?: ExpandItemOptions): void {
        this.#node.setExpanded(expanded, options?.bubble);
    }
}
