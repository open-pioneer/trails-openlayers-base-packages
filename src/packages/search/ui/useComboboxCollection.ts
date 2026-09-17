// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createListCollection, ListCollection } from "@chakra-ui/react";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useMemo } from "react";
import { SearchResult, SearchSource } from "../api";
import { SearchOperationState, SearchViewModel } from "../model";
import { GetSearchSourceId } from "./useSearchSourceId";

/**
 * Represents the results of a single search source for the combobox component.
 */
export interface SearchOptionGroup {
    /** Unique id of this group. */
    id: string;

    /** Display text shown in menu. */
    label: string;

    /** Search source represented by this group. */
    source: SearchSource;

    /** Set of options that belong to this group. */
    options: SearchOption[];
}

/**
 * Represents one search result for the combobox component.
 */
export interface SearchOption {
    /** Unique value for this option. */
    value: string;

    /** Display text shown in menu. */
    label: string;

    /** Search source that returned the suggestion. */
    source: SearchSource;

    /** Links to the parent group. */
    group: SearchOptionGroup;

    /** The raw result from the search source. */
    result: SearchResult;
}

const EMPTY_GROUPS: SearchOptionGroup[] = [];

/**
 * Creates a list collection of {@link SearchOption | SearchOptions}, suitable for chakra's
 * combobox component.
 */
export function useComboboxCollection(
    viewModel: SearchViewModel,
    getSourceId: GetSearchSourceId
): ListCollection<SearchOption> {
    const groups = useReactiveSnapshot(
        () => buildOptionGroups(viewModel.currentSearchState, getSourceId),
        [viewModel, getSourceId]
    );

    return useMemo(() => {
        const options = groups.flatMap((group) => group.options);
        return createListCollection({
            items: options,
            groupBy: (item) => item.group.id,
            itemToString: (item) => item.label || "",
            itemToValue: (item) => item.value || ""
        });
    }, [groups]);
}

/**
 * Creates an array of option groups (one per source), each containing the source's results.
 */
export function buildOptionGroups(
    state: SearchOperationState,
    getSourceId: GetSearchSourceId
): SearchOptionGroup[] {
    if (state.pending) {
        // NOTE: Could optimize the UX a bit here.
        // For example: show previous results of a search while the new search is pending.
        // This would prevent flickering while typing.
        return EMPTY_GROUPS;
    }

    return state.sourceResults.map(({ source, results }) => {
        const group: SearchOptionGroup = {
            id: getSourceId(source),
            source,
            label: source.label,
            options: []
        };
        for (const result of results) {
            group.options.push({
                source,
                result,
                value: getOptionValue(getSourceId, source, result),
                label: result.label,
                group: group
            });
        }
        return group;
    });
}

/**
 * Returns the combobox value that identifies the given result.
 *
 * The value is unique within this component: source ids are unique, and result ids are
 * unique within a source.
 */
export function getOptionValue(
    getSourceId: GetSearchSourceId,
    source: SearchSource,
    result: SearchResult
): string {
    return `${getSourceId(source)}-${result.id}`;
}
