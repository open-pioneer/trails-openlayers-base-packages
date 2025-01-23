// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createContext, Provider, useContext } from "react";

const TocModelContext = createContext<TocModel | undefined>(undefined);

export const TocModelProvider: Provider<TocModel> = TocModelContext.Provider as Provider<TocModel>;

export function useTocModel(): TocModel {
    const model = useContext(TocModelContext);
    if (!model) {
        throw new Error("Internal error: TocModel not found in context");
    }
    return model;
}

/** Note: internal for now */
export interface TocModel {
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
 * Represents an item in the toc.
 *
 * Currently items register themselves in the model when they are mounted
 * and remove themselves when they are unmounted.
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
