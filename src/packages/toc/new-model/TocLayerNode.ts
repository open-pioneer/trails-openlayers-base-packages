// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed, Reactive, reactive } from "@conterra/reactivity-core";
import { shallowEqual } from "@open-pioneer/core";
import { AnyLayer } from "@open-pioneer/map";
import { LayerTocAttributes } from "../ui/Toc";
import {
    getLayerIssues,
    isSevere,
    LayerIssue,
    layerIssuesEqual,
    minSeverity,
    PropagatedIssue
} from "./LayerIssue";
import { SyncedChildNodes } from "./SyncedChildNodes";
import { SharedData, TocWidgetOptions } from "./TocViewModel";

/**
 * Represents a single layer in the toc.
 *
 * Currently, all layers have an associated layer node, even if they are not shown in the toc.
 *
 * @internal
 */
export class TocLayerNode {
    readonly parent: TocLayerNode | undefined;
    readonly layer: AnyLayer;

    #shared: SharedData;
    #syncedChildren: SyncedChildNodes;

    #shown = computed(() => {
        // A node can only be shown if its parent shows its children.
        if (this.parent && !this.parent.shouldShowChildren) {
            return false;
        }

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
    // Note: `isShown` of a child already takes `this.shouldShowChildren` into account.
    #shownChildren = computed(() => this.children.filter((c) => c.isShown), {
        equal: shallowEqual
    });
    #hasShownChildren = computed(() => this.children.some((c) => c.isShown));

    #expanded: Reactive<boolean>;

    // Structural equality: stops the propagation to parent nodes if nothing relevant changed.
    #immediateIssues = computed(() => getLayerIssues(this.layer), { equal: layerIssuesEqual });
    #issues = computed(() => this.#evaluateIssues(), { equal: nodeIssuesEqual });

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
     * The issues associated with this node.
     *
     * These should be shown directly on the UI element for this node.
     * If there is no such item (e.g. for `internal` layers or `listMode: "hide"`),
     * the (severe) issues will be shown by the closest shown ancestor instead (see {@link NodeIssues.propagated}).
     */
    get issues(): NodeIssues {
        return this.#issues.value;
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

    /**
     * Combines direct issues from this instance with the (potential) issues of any child nodes.
     */
    #evaluateIssues(): NodeIssues {
        const own: LayerIssue[] = [...this.#immediateIssues.value];
        const propagated: PropagatedIssue[] = [];

        // If the layer itself failed to load, the children are unavailable as a consequence
        // (e.g. all sublayers of a broken WMS). Reporting them as well would only add noise.
        if (own.some((issue) => issue.kind === "layer-not-available")) {
            return { own, propagated };
        }

        let hasChildIssue = false;
        for (const child of this.children) {
            // Infos (and lower) are not reported to the parent.
            const childIssues = child.issues;
            const childOwn = childIssues.own.filter(isSevere);
            const childPropagated = childIssues.propagated.filter(isSevere);
            if (!childOwn.length && !childPropagated.length) {
                continue;
            }

            if (child.isShown) {
                // Shown child (renders its own issues): just set a flag on this node.
                hasChildIssue = true;
            } else {
                // Hidden child: show its issues on this node (with their source), otherwise they would get lost.
                for (const issue of childOwn) {
                    if (issue.kind === "children-not-available") {
                        continue;
                    }

                    // Treat errors from children as warnings only on their parent.
                    propagated.push({
                        ...issue,
                        severity: minSeverity(issue.severity, "warning"),
                        layer: child.layer
                    });
                }
                // Already capped by the child.
                propagated.push(...childPropagated);
            }
        }

        if (hasChildIssue) {
            own.push({
                severity: "warning",
                kind: "children-not-available"
            });
        }
        return { own, propagated };
    }
}

/**
 * The full set of issues associated with a toc node.
 */
export interface NodeIssues {
    /**
     * Issues of the node itself.
     */
    own: LayerIssue[];

    /**
     * Issues of descendants that are _not_ shown in the toc.
     */
    propagated: PropagatedIssue[];
}

function nodeIssuesEqual(a: NodeIssues, b: NodeIssues): boolean {
    return layerIssuesEqual(a.own, b.own) && layerIssuesEqual(a.propagated, b.propagated);
}

function getTocAttributes(layer: AnyLayer): LayerTocAttributes | undefined {
    return layer.attributes.toc as LayerTocAttributes | undefined;
}
