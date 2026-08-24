// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed, Reactive, reactive } from "@conterra/reactivity-core";
import { AnyLayer } from "@open-pioneer/map";
import { LayerTocAttributes } from "../ui/Toc";
import { SyncedChildNodes } from "./SyncedChildNodes";
import { SharedData, TocWidgetOptions } from "./TocViewModel";

/**
 * @internal
 */
export class TocLayerNode {
    readonly parent: TocLayerNode | undefined;
    readonly layer: AnyLayer;

    #shared: SharedData;
    #syncedChildren: SyncedChildNodes;

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

    #expanded: Reactive<boolean>;

    constructor(layer: AnyLayer, parent: TocLayerNode | undefined, shared: SharedData) {
        this.parent = parent;
        this.layer = layer;
        this.#shared = shared;
        this.#expanded = reactive(!this.#shared.options.initiallyCollapsed);

        // Never has any children if children == null
        let getLayers;
        if (layer.children != null) {
            getLayers = () =>
                this.layer.children?.getItems({
                    sortByDisplayOrder: true,
                    includeInternalLayers: true
                }) ?? [];
        }

        this.#syncedChildren = new SyncedChildNodes({
            createChildNode: (layer) => new TocLayerNode(layer, this, this.#shared),
            getLayers
        });

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

        this.#syncedChildren.destroy();
    }

    get id(): string {
        return this.layer.id;
    }

    /**
     * The widget's global options, provided here for convenience.
     */
    get options(): TocWidgetOptions {
        return this.#shared.options;
    }

    get children(): TocLayerNode[] {
        return this.#syncedChildren.children;
    }

    get isExpanded(): boolean {
        if (!this.options.collapsibleGroups) {
            return true;
        }
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

    get isVisible(): boolean {
        return this.layer.visible;
    }

    setVisible(visible: boolean) {
        this.layer.setVisible(visible);
        if (visible && this.parent && this.options.autoShowParents) {
            this.parent.setVisible(visible);
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
