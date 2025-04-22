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
 * API to control the Toc component imperatively
 */
export interface TocAPI {
    /**
     * Return the global widget options.
     *
     * Throws {@link TocApiDisposedError}
     *
     * NOTE: The object itself is reactive, but individual properties are not (change -> replace).
     */
    readonly options: TocWidgetOptions;

    /**
     * Returns the item that corresponds with the `layerId`.
     *
     * Throws {@link TocApiDisposedError}
     */
    getItem(layerId: string): TocItem | undefined;

    /**
     * Returns the list of all items.
     *
     * Throws {@link TocApiDisposedError}
     */
    getItems(): TocItem[];

    /**
     * Indicates if the API reference is disposed.
     * This is the case after the Toc component is unmounted.
     */
    get disposed(): boolean;
}

/**
 * Shared model used by the Toc and all its sub-components.
 * Extends the external TocAPI with private, internal properties.
 *
 * @internal
 */
export interface TocModel extends TocAPI {
    // Used by toc item components to register themselves
    registerItem(item: TocItem): void;
    unregisterItem(item: TocItem): void;

    set disposed(isDisposed: boolean);
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
     * specific css class of the layer item element
     */
    readonly className: string;

    /**
     * Expands or collapses the list item.
     *
     * Note: not all list items support this operation.
     */
    setExpanded(expanded: boolean, options?: ExpandLayerItemOptions): void;
}

export interface ExpandLayerItemOptions {
    /**
     * align parent items
     */
    bubbleExpandedState: boolean;
}

export interface TocApiReadyEvent {
    apiRef: TocAPI;
}

export type TocApiReadyHandler = (event: TocApiReadyEvent) => void;

/**
 * Thrown if {@link TocAPI} reference is accessed but has already been disposed.
 * This typically happens after the Toc component is unmounted.
 */
export class TocApiDisposedError extends Error {}
