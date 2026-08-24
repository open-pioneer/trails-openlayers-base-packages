// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed, reactive, Reactive, reactiveMap, ReactiveMap } from "@conterra/reactivity-core";
import { MapModel } from "@open-pioneer/map";
import { SyncedChildNodes } from "./SyncedChildNodes";
import { TocLayerNode } from "./TocLayerNode";

/**
 * Global toc widget options.
 *
 * @internal
 */
export interface TocWidgetOptions {
    /**
     * True: When showing a child, show all parents as well (`setVisible(true)`).
     */
    autoShowParents: boolean;

    /**
     * True: Layer items with children can be collapsed.
     */
    collapsibleGroups: boolean;

    /**
     * True: All groups are initially collapsed.
     */
    initiallyCollapsed: boolean;
}

/**
 * Data shared by the view model and all it sub objects.
 *
 * @internal
 */
export interface SharedData {
    /**
     * Id -> Node mapping for all nodes in the model.
     * These are updated by the synchronization code whenever node are created or destroyed.
     */
    nodesById: ReactiveMap<string, TocLayerNode>;

    /**
     * The global widget settings (reactive).
     */
    readonly options: TocWidgetOptions;
}

/**
 * Source of truth for all major UI state.
 */
export class TocViewModel {
    #map: MapModel;
    #options: Reactive<TocWidgetOptions>;
    #shared: SharedData;
    #syncedChildren: SyncedChildNodes;

    #shownChildren = computed(() => this.children.filter((c) => c.show));

    constructor(map: MapModel, options: TocWidgetOptions) {
        this.#map = map;

        const optionsSignal = (this.#options = reactive(options));
        this.#shared = {
            nodesById: reactiveMap(),
            get options() {
                return optionsSignal.value;
            }
        };
        this.#syncedChildren = new SyncedChildNodes({
            createChildNode: (layer) => new TocLayerNode(layer, undefined, this.#shared),
            getLayers: () =>
                this.#map.layers.getOperationalLayers({
                    sortByDisplayOrder: true,
                    includeInternalLayers: true
                })
        });
    }

    destroy() {
        this.#syncedChildren.destroy();
    }

    /**
     * Returns the toc node associated with the given id.
     */
    getNodeById(id: string): TocLayerNode | undefined {
        return this.#shared.nodesById.get(id);
    }

    /**
     * Returns the full set of top level toc nodes in this view model, in display order.
     *
     * Nested children can be reached by walking the object graph.
     */
    get children(): TocLayerNode[] {
        return this.#syncedChildren.children;
    }

    /**
     * Returns the list of children that are actually presented to the user, as UI items.
     *
     * Not to be confused with the layer's visibility.
     */
    get shownChildren(): TocLayerNode[] {
        return this.#shownChildren.value;
    }

    /**
     * The global widget settings (reactive).
     */
    get options(): TocWidgetOptions {
        return this.#options.value;
    }

    /**
     * Applies the given options.
     */
    setOptions(newOptions: TocWidgetOptions): void {
        this.#options.value = newOptions;
    }
}
