// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { FC, useEffect, useRef } from "react";
import {
    SearchApi,
    SearchClearEvent,
    SearchDisposedEvent,
    SearchReadyEvent,
    SearchSelectEvent,
    SearchSource
} from "../api";
import { SearchApiImpl } from "./SearchApiImpl";
import { SearchInput } from "./SearchInput";
import { useSearchState } from "./useSearchState";

/**
 * Properties supported by the {@link Search} component.
 */
export interface SearchProps extends CommonComponentProps, MapModelProps {
    /**
     * Data sources to be searched on.
     */
    sources: SearchSource[];

    /**
     * Typing delay (in milliseconds) before the async search query starts after the user types in the search term.
     * Defaults to `200`.
     */
    searchTypingDelay?: number;

    /**
     * The maximum number of results shown per group.
     * Defaults to `5`.
     */
    maxResultsPerGroup?: number;

    /**
     * The placeholder text shown in the search input field when it is empty.
     * Defaults to a generic (and localized) hint.
     */
    placeholder?: string;

    /**
     * This event handler will be called when the user selects a search result.
     */
    onSelect?: (event: SearchSelectEvent) => void;

    /**
     * This event handler will be called when the user clears the search input.
     */
    onClear?: (event: SearchClearEvent) => void;

    /**
     * Callback that is triggered once when the search is initialized.
     * The search API can be accessed by the `api` property of the {@link SearchReadyEvent}.
     */
    onReady?: (event: SearchReadyEvent) => void;

    /**
     * Callback that is triggered once when the search is disposed and unmounted.
     */
    onDisposed?: (event: SearchDisposedEvent) => void;
}

/**
 * A component that allows the user to search a given set of {@link SearchSource | SearchSources}.
 */
export const Search: FC<SearchProps> = (props) => {
    const {
        sources,
        searchTypingDelay,
        maxResultsPerGroup,
        placeholder,
        onSelect,
        onClear,
        onReady,
        onDisposed
    } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const map = useMapModelValue(props);
    const { input, results, onInputChanged, onOptionConfirmed, selectedOption } = useSearchState(
        sources,
        searchTypingDelay,
        maxResultsPerGroup,
        map
    );

    // api trigger hooks
    useSearchApi(onReady, onDisposed, onInputChanged, onClear);

    return (
        <Box {...containerProps} width={"100%"}>
            <SearchInput
                input={input}
                selectedOption={selectedOption}
                results={results}
                placeholder={placeholder}
                onClear={onClear}
                onSelect={onSelect}
                onInputChanged={onInputChanged}
                onOptionConfirmed={onOptionConfirmed}
            />
        </Box>
    );
};

// Note: `clearInput` and `setInputValue` must be stable because only the initial value is used to construct the API instance at this time.
function useSearchApi(
    onReady: ((event: SearchReadyEvent) => void) | undefined,
    onDisposed: ((event: SearchDisposedEvent) => void) | undefined,
    onInputChanged: (newValue: string) => void,
    onClear: ((event: SearchClearEvent) => void) | undefined
) {
    const clearInput = useEvent(() => {
        onInputChanged("");
        onClear?.({ trigger: "api-reset" });
    });

    const apiRef = useRef<SearchApi>(null);
    if (!apiRef.current) {
        // NOTE: The API object is only created once.
        // This is why the functions must currently be stable!
        apiRef.current = new SearchApiImpl(clearInput, onInputChanged);
    }

    const api = apiRef.current;

    const readyTrigger = useEvent(() => {
        onReady?.({
            api
        });
    });

    const disposeTrigger = useEvent(() => {
        onDisposed?.({});
    });

    // Trigger ready / dispose on mount / unmount, but if the callbacks change.
    // useEvent() returns a stable function reference.
    useEffect(() => {
        readyTrigger();
        return disposeTrigger;
    }, [readyTrigger, disposeTrigger]);
}
