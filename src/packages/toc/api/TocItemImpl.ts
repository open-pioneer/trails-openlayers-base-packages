// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { batch } from "@conterra/reactivity-core";
import { TocLayerNode } from "../new-model/TocLayerNode";
import { ExpandItemOptions, TocItem } from "./types";

export class TocItemImpl implements TocItem {
    #node: TocLayerNode;

    constructor(node: TocLayerNode) {
        this.#node = node;
    }

    get id() {
        return this.layerId;
    }

    get layer() {
        return this.#node.layer;
    }

    get layerId() {
        return this.layer.id;
    }

    get isExpanded() {
        return this.#node.isExpanded;
    }

    get htmlElement() {
        return this.#node.htmlElement;
    }

    setExpanded(expanded: boolean, options?: ExpandItemOptions): void {
        batch(() => {
            this.#node.setExpanded(expanded, options?.bubble);
        });
    }
}
