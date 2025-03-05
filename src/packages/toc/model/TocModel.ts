// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createContext, Provider, useContext } from "react";

const TocModelContext = createContext<TocModel | undefined>(undefined);

/**
 * Provider for the toc's shared model.
 * Used at the root of the component.
 */
export const TocModelProvider: Provider<TocModel> = TocModelContext.Provider as Provider<TocModel>;

/**
 * Returns the shared model for the current toc component.
 */
export function useTocModel(): TocModel {
    const model = useContext(TocModelContext);
    if (!model) {
        throw new Error("Internal error: TocModel not found in context.");
    }
    return model;
}

/**
 * Shared model used by the toc and all its sub-components.
 *
 * @internal
 */
export interface TocModel {
    /**
     * Return the global widget options.
     *
     * NOTE: The object itself is reactive, but individual properties are not (change -> replace).
     */
    readonly options: TocWidgetOptions;

    /**
     * Returns the item that corresponds with the `layerId`.
     */
    getItem(layerId: string): TocItem | undefined;

    /**
     * Returns the list of all items.
     */
    getItems(): TocItem[];

    // Used by toc item components to register themselves
    registerItem(item: TocItem): void;
    unregisterItem(item: TocItem): void;
}

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
 * Represents an item in the toc.
 *
 * Currently items register themselves in the model when they are mounted
 * and remove themselves when they are unmounted.
 *
 * @internal
 */
export interface TocItem {
    /**
     * Identifier of the layer that corresponds with the list item.
     */
    readonly layerId: string;

    /**
     * true if list item is expanded.
     */
    readonly isExpanded: boolean;

    /**
     * Expands or collapses the list item.
     *
     * Note: not all list items support this operation.
     */
    setExpanded(expanded: boolean): void;
}
