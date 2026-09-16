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

    #shown = computed(() => {
        const tocAttributes = getTocAttributes(this.layer);
        if (tocAttributes && tocAttributes.listMode) {
            return tocAttributes.listMode !== "hide";
        } else {
            return !this.layer.internal;
        }
    });
    #showChildren = computed(() => {
        if (!this.isShown) {
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
        // TODO: inconsistent with `#shownChildren` (this.show vs this.showChildren).
        //       decide on one way, and document it clearly.
        if (!this.isShown) {
            return false;
        }
        return this.children.some((c) => c.isShown);
    });
    #shownChildren = computed(() => {
        if (!this.shouldShowChildren) {
            return [];
        }
        return this.children.filter((c) => c.isShown);
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

    /**
     * The unique id of this node within its component.
     */
    get id(): string {
        return this.layer.id;
    }

    /**
     * The widget's global options, provided here for convenience.
     */
    get options(): TocWidgetOptions {
        return this.#shared.options;
    }

    /**
     * Returns the full set of children.
     *
     * See also {@link shownChildren}.
     */
    get children(): TocLayerNode[] {
        return this.#syncedChildren.children;
    }

    /**
     * Returns the list of children that are actually presented to the user, as UI items.
     *
     * Not to be confused with the layer's visibility.
     *
     * See also {@link children}.
     */
    get shownChildren(): TocLayerNode[] {
        return this.#shownChildren.value;
    }

    /**
     * Whether the item is currently expanded (children are shown).
     */
    get isExpanded(): boolean {
        if (!this.options.collapsibleGroups) {
            return true;
        }
        return this.#expanded.value;
    }

    /**
     * Whether this node should be shown in the UI.
     *
     * See also {@link isShown}.
     */
    get isShown(): boolean {
        return this.#shown.value;
    }

    /**
     * Whether this node's _children_ should be shown in the UI.
     *
     * See also {@link isShown}.
     */
    get shouldShowChildren(): boolean {
        return this.#showChildren.value;
    }

    /**
     * Whether any children of this node should be shown in the UI.
     */
    get hasShownChildren(): boolean {
        return this.#hasShownChildren.value;
    }

    /**
     * Whether the layer associated with this node is currently visible in the map.
     */
    get isVisible(): boolean {
        return this.layer.visible;
    }

    /**
     * Toggles the visibility of the layer associated with this node.
     *
     * If `autoShowParents` is enabled (the default), then parents of a layer
     * are also made visible when a child is made visible.
     */
    setVisible(visible: boolean) {
        this.layer.setVisible(visible);
        if (visible && this.parent && this.options.autoShowParents) {
            this.parent.setVisible(visible);
        }
    }

    /**
     * Toggles the expanded state of this node.
     * Expanded nodes may show their children.
     *
     * By default, `expanded: true` will bubble to the parents (expanded them as well).
     */
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
