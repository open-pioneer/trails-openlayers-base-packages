// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, Reactive, reactiveMap } from "@conterra/reactivity-core";
import { TocItem } from "./types";

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
 * Shared model used by the Toc and all its sub-components.
 * Extends the external TocAPI with private, internal properties.
 *
 * @internal
 */
export class TocModel {
    #options: Reactive<TocWidgetOptions>;

    // Indexed by layerId
    #items = reactiveMap<string, TocItem>();

    constructor(initialOptions: TocWidgetOptions) {
        this.#options = reactive(initialOptions);
    }

    /**
     * Return the global widget options.
     *
     * NOTE: The object itself is reactive, but individual properties are not (change -> replace).
     * See {@link updateOptions}.
     */
    get options() {
        return this.#options.value;
    }

    getItemById(id: string): TocItem | undefined {
        return this.#items.get(id);
    }

    getItemByLayerId(layerId: string): TocItem | undefined {
        return this.getItemById(layerId); // happens to be the same at the moment
    }

    getItems(): TocItem[] {
        return Array.from(this.#items.values());
    }

    // Used by toc item components to register themselves
    registerItem(item: TocItem): void {
        if (this.#items.has(item.id)) {
            throw new Error(`Item with layerId '${item.layerId}' already registered.`);
        }
        this.#items.set(item.id, item);
    }

    // Used by toc item components to register themselves
    unregisterItem(item: TocItem): void {
        if (this.#items.get(item.id) !== item) {
            throw new Error(`Item with layerId '${item.layerId}' not registered.`);
        }
        this.#items.delete(item.id);
    }

    updateOptions(options: TocWidgetOptions) {
        this.#options.value = options;
    }
}

export function createOptions(
    autoShowParents?: boolean | undefined,
    collapsibleGroups?: boolean | undefined,
    isCollapsed?: boolean | undefined
): TocWidgetOptions {
    return {
        autoShowParents: autoShowParents ?? true,
        collapsibleGroups: collapsibleGroups ?? false,
        initiallyCollapsed: isCollapsed ?? false
    };
}
