// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed, reactive } from "@conterra/reactivity-core";
import { Resource, createLogger, destroyResource } from "@open-pioneer/core";
import { AnyLayer } from "@open-pioneer/map";
import { sourceId } from "open-pioneer:source-info";
import { LayerTocAttributes } from "../ui/Toc";
import { createNodeChildren, syncChildren } from "./syncChildren";
import { SharedData } from "./TocViewModel";

const LOG = createLogger(sourceId);

export class TocLayerNode {
    readonly parent: TocLayerNode | undefined;
    readonly layer: AnyLayer;

    #shared: SharedData;
    #children = createNodeChildren();
    #layersWatch: Resource | undefined;
    #show = computed(() => {
        const tocAttributes = getTocAttributes(this.layer);
        if (tocAttributes && tocAttributes.listMode) {
            return tocAttributes.listMode !== "hide";
        } else {
            return !this.layer.internal;
        }
    });
    #showChildren = computed(() => {
        if (!this.show) {
            return false;
        }

        const tocAttributes = getTocAttributes(this.layer);
        if (tocAttributes && tocAttributes.listMode) {
            return tocAttributes.listMode !== "hide-children";
        } else {
            return true;
        }
    });
    #hasShownChildren = computed(() => {
        if (!this.show) {
            return false;
        }

        for (const child of this.children) {
            if (child.show) {
                return true;
            }
        }
        return false;
    });
    #expanded = reactive(true);

    constructor(layer: AnyLayer, parent: TocLayerNode | undefined, shared: SharedData) {
        this.parent = parent;
        this.layer = layer;
        this.#shared = shared;

        // Never has any children if children == null
        if (layer.children != null) {
            this.#layersWatch = syncChildren({
                parent: this,
                shared: this.#shared,
                getLayers: () =>
                    this.layer.children?.getItems({
                        sortByDisplayOrder: true,
                        includeInternalLayers: true
                    }) ?? [],
                children: this.#children
            });
        }

        // Register this node in global node index.
        const nodesById = this.#shared.nodesById;
        const id = this.id;
        nodesById.set(id, this);
    }

    destroy() {
        // Unregister this node from the global index.
        const nodesById = this.#shared.nodesById;
        const id = this.id;
        if (nodesById.get(id) == this) {
            nodesById.delete(id);
        }

        this.#layersWatch = destroyResource(this.#layersWatch);
    }

    get id(): string {
        return this.layer.id;
    }

    get children(): TocLayerNode[] {
        return this.#children.order.value;
    }

    // TODO: Implement 'initiallyCollapsed' option --> use this as the initial value for expanded
    get isExpanded(): boolean {
        return this.#expanded.value;
    }

    get show(): boolean {
        return this.#show.value;
    }

    get showChildren(): boolean {
        return this.#showChildren.value;
    }

    get hasShownChildren(): boolean {
        return this.#hasShownChildren.value;
    }

    get visible(): boolean {
        return this.layer.visible;
    }

    setVisible(visible: boolean) {
        this.layer.setVisible(visible);
        if (visible) {
            this.parent?.setVisible(visible);
        }
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

function getTocAttributes(layer: AnyLayer): LayerTocAttributes | undefined {
    return layer.attributes.toc as LayerTocAttributes | undefined;
}
