// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef } from "react";
import { SearchSource } from "../api";

export type GetSearchSourceId = (source: SearchSource) => string;

const GENERATED_ID_PREFIX = "__anon_source_";

/**
 * Assigns unique (and stable) IDs to search sources.
 *
 * Sources that define their own {@link SearchSource.id} keep that id;
 * for all other sources an id is generated.
 */
export function useSearchSourceId(): GetSearchSourceId {
    const sourceIds = useRef<WeakMap<SearchSource, string>>(undefined);
    const counter = useRef(0);
    if (!sourceIds.current) {
        sourceIds.current = new WeakMap();
    }

    return useCallback((source: SearchSource) => {
        if (source.id != null) {
            return source.id;
        }

        // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ids = sourceIds.current!;
        if (!ids.has(source)) {
            ids.set(source, `${GENERATED_ID_PREFIX}${counter.current++}`);
        }
        // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ids.get(source)!;
    }, []);
}
