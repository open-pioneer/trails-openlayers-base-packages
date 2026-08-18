// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box } from "@chakra-ui/react";
import { MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useEffectEvent, useMemo } from "react";
import {
    SearchClearEvent,
    SearchDisposedEvent,
    SearchReadyEvent,
    SearchSelectEvent,
    SearchSource
} from "../api";
import { SearchViewModel } from "../model";
import { SearchApiImpl } from "./SearchApiImpl";
import { SearchInput } from "./SearchInput";
import { useSearchViewModel } from "./useSearchViewModel";

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
     * This event handler will be called when a search result has been selected.
     */
    onSelect?: (event: SearchSelectEvent) => void;

    /**
     * This event handler will be called when the search input has been cleared.
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
    const { onReady, onDisposed, placeholder } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const map = useMapModelValue(props);
    const viewModel = useSearchViewModel(map, props);

    return (
        <Box {...containerProps} width={"100%"}>
            {viewModel && (
                <SearchReady
                    viewModel={viewModel}
                    placeholder={placeholder}
                    onReady={onReady}
                    onDisposed={onDisposed}
                />
            )}
        </Box>
    );
};

interface SearchReadyProps {
    viewModel: SearchViewModel;
    placeholder: string | undefined;
    onReady: ((event: SearchReadyEvent) => void) | undefined;
    onDisposed: ((event: SearchDisposedEvent) => void) | undefined;
}

/**
 * The search component, rendered once its view model exists.
 */
function SearchReady(props: SearchReadyProps) {
    const { viewModel, placeholder, onReady, onDisposed } = props;
    useSearchApi(viewModel, onReady, onDisposed);
    return <SearchInput viewModel={viewModel} placeholder={placeholder} />;
}

/**
 * Creates the public {@link SearchApi} and triggers the ready / disposed events.
 */
function useSearchApi(
    viewModel: SearchViewModel,
    onReady: ((event: SearchReadyEvent) => void) | undefined,
    onDisposed: ((event: SearchDisposedEvent) => void) | undefined
) {
    // The API controls a single view model instance.
    // A new API is handed out if the view model is replaced (which happens when the map changes).
    // It might also do Non-ViewModel things in the future (e.g. focus handling), so this is not necessarily just a wrapper.
    const api = useMemo(() => new SearchApiImpl(viewModel), [viewModel]);

    const readyTrigger = useEffectEvent(() => {
        onReady?.({ api });
    });

    const disposeTrigger = useEffectEvent(() => {
        onDisposed?.({});
    });

    // The ready / disposed events bracket the lifetime of the API.
    useEffect(() => {
        readyTrigger();
        return () => disposeTrigger();
    }, [api]);
}
