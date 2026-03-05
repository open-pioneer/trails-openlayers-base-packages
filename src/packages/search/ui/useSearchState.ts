// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { useEvent } from "@open-pioneer/react-utils";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { SearchResult, SearchSource } from "../api";
import { sourceId } from "open-pioneer:source-info";
import { SearchController, ResultGroup } from "../model/SearchController";

const LOG = createLogger(sourceId);

export interface SearchOptionGroup {
    /** Unique id of this group. */
    id: string;

    /** Display text shown in menu. */
    label: string;

    /** Set of options that belong to this group. */
    options: SearchOption[];
}

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

export interface SearchState {
    input: string;
    results: SearchResultsState;
    selectedOption: SearchOption | undefined;

    // NOTE: Stable functions
    onOptionConfirmed: (newOption: SearchOption) => void;
    onInputChanged: (newInput: string) => void;
}

export type SearchResultsReady = {
    kind: "ready";
    results: SearchOptionGroup[];
};

export type SearchResultsLoading = {
    kind: "loading";
};

export type SearchResultsState = SearchResultsReady | SearchResultsLoading;

/**
 * Keeps track of the current input text, active searches and their results.
 *
 * NOTE: it would be great to merge this state handling with the search controller
 * in a future revision.
 */
export function useSearchState(
    sources: SearchSource[],
    searchTypingDelay: number | undefined,
    maxResultsPerGroup: number | undefined,
    map: MapModel
): SearchState {
    interface FullSearchState {
        query: string;
        selectedOption: SearchOption | undefined;
        search: SearchResultsState;
    }

    const getId = useSearchSourceId();
    const controller = useController(sources, searchTypingDelay, maxResultsPerGroup, map);

    type Action =
        | { kind: "input"; query: string }
        | { kind: "select-option"; option: SearchOption }
        | { kind: "load-results" }
        | { kind: "accept-results"; results: SearchOptionGroup[] };

    const [state, dispatch] = useReducer(
        (current: FullSearchState, action: Action): FullSearchState => {
            switch (action.kind) {
                case "input":
                    return {
                        ...current,
                        query: action.query,
                        selectedOption: undefined
                    };
                case "select-option":
                    return {
                        ...current,
                        selectedOption: action.option,
                        query: action.option.label
                    };
                case "load-results":
                    return {
                        ...current,
                        search: {
                            kind: "loading"
                        }
                    };
                case "accept-results":
                    return {
                        ...current,
                        search: {
                            kind: "ready",
                            results: action.results
                        }
                    };
            }
        },
        undefined,
        (): FullSearchState => ({
            query: "",
            selectedOption: undefined,
            search: {
                kind: "ready",
                results: []
            }
        })
    );

    // Stores the promise for the current search.
    // Any results from outdated searches are ignored.
    const currentSearch = useRef<Promise<unknown>>(undefined);
    const startSearch = useEvent((query: string) => {
        if (!controller) {
            currentSearch.current = undefined;
            dispatch({ kind: "accept-results", results: [] });
            return;
        }

        LOG.isDebug() && LOG.debug(`Starting new search for query ${JSON.stringify(query)}.`);
        dispatch({ kind: "load-results" });
        const promise = (currentSearch.current = search(controller, query, getId).then(
            (results) => {
                // Check if this job is still current
                if (currentSearch.current === promise) {
                    dispatch({ kind: "accept-results", results });
                }
            }
        ));
    });

    // Called when the user confirms a search result
    const onOptionConfirmed = useEvent((option: SearchOption) => {
        // Do not start a new search when the user confirms a result
        dispatch({ kind: "select-option", option });
    });

    // Called when a user types into the input field
    const onInputChanged = useEvent((newValue: string) => {
        // Trigger a new search if the user changes the query by typing
        dispatch({ kind: "input", query: newValue });
        startSearch(newValue);
    });

    return {
        input: state.query,
        results: state.search,
        selectedOption: state.selectedOption,
        onOptionConfirmed,
        onInputChanged
    };
}

async function search(
    controller: SearchController,
    query: string,
    getId: GetSearchSourceId
): Promise<SearchOptionGroup[]> {
    let suggestions: ResultGroup[];
    try {
        suggestions = await controller.search(query);
    } catch (error) {
        if (!isAbortError(error)) {
            LOG.error(`Search failed`, error);
        }
        suggestions = [];
    }
    return mapSuggestions(suggestions, getId);
}

/**
 * Creates a controller to search on the given sources.
 */
function useController(
    sources: SearchSource[],
    searchTypingDelay: number | undefined,
    maxResultsPerGroup: number | undefined,
    map: MapModel
) {
    const [controller, setController] = useState<SearchController | undefined>(undefined);
    useEffect(() => {
        const controller = new SearchController(map, sources);
        setController(controller);
        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, sources]);

    useEffect(() => {
        if (controller) {
            controller.searchTypingDelay = searchTypingDelay;
        }
    }, [controller, searchTypingDelay]);
    useEffect(() => {
        if (controller) {
            controller.maxResultsPerSource = maxResultsPerGroup;
        }
    }, [controller, maxResultsPerGroup]);
    return controller;
}

// Maps results from search source to objects that the UI can work with.
function mapSuggestions(
    resultGroups: ResultGroup[],
    getId: GetSearchSourceId
): SearchOptionGroup[] {
    return resultGroups.map((resultGroup): SearchOptionGroup => {
        const groupId = getId(resultGroup.source);
        const optionGroup: SearchOptionGroup = {
            id: groupId,
            label: resultGroup.label,
            options: []
        };

        for (const result of resultGroup.results) {
            optionGroup.options.push({
                // unique (in this component)
                value: `${groupId}-${result.id}`,
                label: result.label,
                group: optionGroup,
                source: resultGroup.source,
                result: result
            });
        }
        return optionGroup;
    });
}

type GetSearchSourceId = (source: SearchSource) => string;

function useSearchSourceId(): GetSearchSourceId {
    const sourceIds = useRef<WeakMap<SearchSource, string>>(undefined);
    const counter = useRef(0);
    if (!sourceIds.current) {
        sourceIds.current = new WeakMap();
    }

    return useCallback((searchSource: SearchSource) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ids = sourceIds.current!;
        if (!ids.has(searchSource)) {
            ids.set(searchSource, `source-${counter.current++}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ids.get(searchSource)!;
    }, []);
}
