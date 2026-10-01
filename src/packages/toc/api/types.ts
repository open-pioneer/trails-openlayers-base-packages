// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { type TocApi } from "./TocApi";

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
