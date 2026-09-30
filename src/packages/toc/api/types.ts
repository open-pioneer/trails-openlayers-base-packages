// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * API to control the Toc component imperatively
 */
export interface TocApi {
    /**
     * Returns the toc item for the given `id`.
     */
    getItemById(id: string): TocItem | undefined;

    /**
     * Returns the item that corresponds with the `layerId`.
     */
    getItemByLayerId(layerId: string): TocItem | undefined;

    /**
     * Returns the list of all registered items in the Toc.
     */
    getItems(): TocItem[];
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
     * Currently, this is the same as `layerId`, but that could be changed in the future.
     */
    readonly id: string;

    /**
     * Identifier of the layer that corresponds with the list item.
     * May be undefined if the item does not represent a layer.
     */
    readonly layerId?: string;

    /**
     * `true` if list item is expanded.
     */
    readonly isExpanded: boolean;

    /**
     * DOM element of the underlying {@link LayerItem}, `undefined` if the toc has been disposed
     * or if the item is currently not being rendered.
     */
    readonly htmlElement: HTMLElement | undefined;

    /**
     * Expands or collapses the list item.
     *
     * Note: not all list items support this operation.
     */
    setExpanded(expanded: boolean, options?: ExpandItemOptions): void;
}

export interface ExpandItemOptions {
    /**
     * Align `expanded` state of parent items.
     * By default (`undefined`), the status is only passed on to the parents when the Toc item is being expanded but not if it is being collapsed.
     */
    bubble?: boolean;
}

/**
 * Event that indicates that the Toc component is initialized.
 * The event carries a reference to the public {@link TocApi}
 */
export interface TocReadyEvent {
    /**
     * Reference to the Toc API that allows manipulating the Toc.
     */
    api: TocApi;
}

/**
 * Event that indicates that the Toc component has been disposed.
 *
 * Empty interface, might be extended in the future
 */
export interface TocDisposedEvent {}
