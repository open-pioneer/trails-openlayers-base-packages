// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef } from "react";
import { SelectionSource } from "../api";

export type GetSelectionSourceId = (selectionSource: SelectionSource) => string;

const GENERATED_ID_PREFIX = "__anon_source_";

/**
 * Assigns unique IDs to selection sources.
 *
 * Sources that define their own {@link SelectionSource.id} keep that id;
 * for all other sources an id is generated.
 */
export function useSelectionSourceId(): GetSelectionSourceId {
    const sourceIds = useRef<WeakMap<SelectionSource, string>>(undefined);
    const counter = useRef(0);
    if (!sourceIds.current) {
        sourceIds.current = new WeakMap();
    }

    return useCallback((source: SelectionSource) => {
        if (source.id != null) {
            return source.id;
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ids = sourceIds.current!;
        if (!ids.has(source)) {
            ids.set(source, `${GENERATED_ID_PREFIX}${counter.current++}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ids.get(source)!;
    }, []);
}
