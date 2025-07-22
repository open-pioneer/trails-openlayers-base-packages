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
     * Returns the toc item for `id`.
     * @param id
     */
    getItemById(id: string): TocItem | undefined;

    /**
     * Returns the item that corresponds with the `layerId`.
     * @param layerId
     */
    getItemByLayerId(layerId: string): TocItem | undefined;

    /**
     * Returns the list of all registered items in the Toc.
     */
    getItems(): TocItem[];
}

/**
 * Shared model used by the Toc and all its sub-components.
 * Extends the external TocAPI with private, internal properties.
 *
 * @internal
 */
export interface TocModel extends TocAPI {
    /**
     * Return the global widget options.
     *
     * NOTE: The object itself is reactive, but individual properties are not (change -> replace).
     */
    readonly options: TocWidgetOptions;

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
 */
export interface TocItem {
    /**
     * Identifier of the Toc item.
     * Currently, this is the same as `layerId` but could be changed in the future.
     */
    readonly id: string;

    /**
     * Identifier of the layer that corresponds with the list item.
     */
    readonly layerId?: string;

    /**
     * true if list item is expanded.
     */
    readonly isExpanded: boolean;

    /**
     * DOM element of the underlying {@link LayerItem}, `null` if the Toc is disposed
     */
    readonly htmlElement: HTMLElement | null;

    /**
     * Expands or collapses the list item.
     *
     * Note: not all list items support this operation.
     */
    setExpanded(expanded: boolean, options?: ExpandLayerItemOptions): void;
}

export interface ExpandLayerItemOptions {
    /**
     * Align `expanded` state of parent items.
     * By default (`undefined`), the status is only passed on to the parents when the Toc item is being expanded but not if it is being collapsed.
     */
    bubble?: boolean;
}

/**
 * Event that indicates that the Toc component is initialized.
 * The event carries a reference to the public {@link TocAPI}
 */
export interface TocReadyEvent {
    /**
     * Reference to the Toc API that allows manipulating the Toc items
     */
    api: TocAPI;
}

/**
 * Event that indicates that the Toc componend has beed disposed
 * Empty interface, might be extended in the future
 */
export interface TocDisposedEvent {}

/**
 * Callback that is triggered when the Toc is initialized.
 */
export type TocReadyHandler = (event: TocReadyEvent) => void;

/**
 * Callback that is triggered when the Toc is disposed.
 */
export type TocDisposedHandler = (event: TocDisposedEvent) => void;
