// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapModel } from "@open-pioneer/map";
import { useEffect, useEffectEvent, useState } from "react";
import { SearchClearEvent, SearchSelectEvent, SearchSource } from "../api";
import { SearchViewModel } from "../model";

/**
 * The react props that are synced into the view model.
 */
export interface ViewModelProps {
    sources: SearchSource[];
    maxResultsPerGroup?: number;
    searchTypingDelay?: number;
    onSelect?: (event: SearchSelectEvent) => void;
    onClear?: (event: SearchClearEvent) => void;
}

/**
 * Initializes the (internal) view model used by the search component.
 *
 * The view model contains the primary widget state.
 * It is a long lived instance that is updated in place when relevant react props are changed.
 */
export function useSearchViewModel(
    map: MapModel,
    props: ViewModelProps
): SearchViewModel | undefined {
    const { sources, maxResultsPerGroup, searchTypingDelay, onSelect, onClear } = props;

    // Stable wrappers around the (possibly changing) react callbacks.
    const selectHandler = useEffectEvent((event: SearchSelectEvent) => onSelect?.(event));
    const clearHandler = useEffectEvent((event: SearchClearEvent) => onClear?.(event));

    // Construct long lived view model instance
    const [viewModel, setViewModel] = useState<SearchViewModel>();
    useEffect(() => {
        const vm = new SearchViewModel({
            map,
            onSelect: selectHandler,
            onClear: clearHandler
        });

        setViewModel(vm);
        return () => {
            setViewModel(undefined);
            vm.destroy();
        };
    }, [map]);

    // Sync fine grained props
    useEffect(() => {
        if (viewModel) {
            viewModel.sources = sources;
        }
    }, [viewModel, sources]);
    useEffect(() => {
        if (viewModel) {
            viewModel.maxResultsPerSource = maxResultsPerGroup;
        }
    }, [viewModel, maxResultsPerGroup]);
    useEffect(() => {
        if (viewModel) {
            viewModel.searchTypingDelay = searchTypingDelay;
        }
    }, [viewModel, searchTypingDelay]);

    return viewModel;
}
