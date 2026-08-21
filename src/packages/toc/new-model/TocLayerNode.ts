// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactive } from "@conterra/reactivity-core";
import { Resource, destroyResource } from "@open-pioneer/core";
import { AnyLayer } from "@open-pioneer/map";
import { syncChildren } from "./syncChildren";

export class TocLayerNode {
    readonly parent: TocLayerNode | undefined;
    readonly layer: AnyLayer;

    #childIndex = new Map<AnyLayer, TocLayerNode>();
    #children = reactive<TocLayerNode[]>([]);
    #layersWatch: Resource | undefined;

    #expanded = reactive(true);

    constructor(layer: AnyLayer, parent: TocLayerNode | undefined) {
        this.parent = parent;
        this.layer = layer;

        // Never has any children if children == null
        if (layer.children != null) {
            this.#layersWatch = syncChildren(
                this,
                this.#childIndex,
                () =>
                    this.layer.children?.getItems({
                        sortByDisplayOrder: true,
                        includeInternalLayers: true
                    }) ?? [],
                this.#children
            );
        }
    }

    destroy() {
        this.#layersWatch = destroyResource(this.#layersWatch);
        for (const child of this.#children.value) {
            child.destroy();
        }
    }

    get id(): string {
        return this.layer.id;
    }

    get children(): TocLayerNode[] {
        return this.#children.value;
    }

    // TODO: Implement 'initiallyCollapsed' option --> use this as the initial value for expanded
    get isExpanded(): boolean {
        return this.#expanded.value;
    }

    setExpanded(expanded: boolean, bubble?: boolean | undefined) {
        this.#expanded.value = expanded;

        //by default bubble if expand is true
        if (bubble == null) {
            bubble = expanded;
        }

        if (bubble) {
            this.parent?.setExpanded(expanded, bubble);
        }
    }
}
