// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext } from "react";

/**
 * Toc context to pass global widget options around (to avoid props drilling).
 *
 * @internal
 */
export interface TocWidgetOptions {
    /** True: When showing a child, show all parents as well (`setVisible(true)`). */
    autoShowParents: boolean;

    /**
     * True: list of children of a LayerItems are collapisble
     */
    collapsibleGroups: boolean;
}

const TocWidgetOptionsContext = createContext<TocWidgetOptions | undefined>(undefined);

export const TocWidgetOptionsProvider =
    TocWidgetOptionsContext.Provider as React.Provider<TocWidgetOptions>;

export function useTocWidgetOptions(): TocWidgetOptions {
    const context = useContext(TocWidgetOptionsContext);
    if (!context) {
        throw new Error("useTocWidgetOptions must be used within a TocWidgetOptionsProvider");
    }
    return context;
}
