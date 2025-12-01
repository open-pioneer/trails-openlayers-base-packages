// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    chakra,
    Combobox,
    ComboboxInputValueChangeDetails,
    ComboboxValueChangeDetails,
    Highlight,
    HStack,
    Icon,
    InputGroup,
    ListCollection,
    Portal,
    Span,
    Spinner,
    useListCollection,
    useToken
} from "@chakra-ui/react";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, Fragment, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SearchController, SuggestionGroup } from "./SearchController";
import {
    SearchApi,
    SearchClearEvent,
    SearchClearTrigger,
    SearchDisposedEvent,
    SearchReadyEvent,
    SearchResult,
    SearchSelectEvent,
    SearchSource
} from "./api";
import { SearchApiImpl } from "./SearchApiImpl";
import { LuSearch } from "react-icons/lu";

const LOG = createLogger("search:Search");

export interface SearchOption {
    /** Unique value for this option. */
    value: string;

    /** Display text shown in menu. */
    label: string;

    /** Search source that returned the suggestion. */
    source: SearchSource;

    /** The raw result from the search source. */
    result: SearchResult;
}

export interface SearchGroupOption {
    /** Display text shown in menu. */
    label: string;

    /** Set of options that belong to this group. */
    options: SearchOption[];
}

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
export const SearchCombobox: FC<SearchProps> = (props) => {
    const {
        sources,
        searchTypingDelay,
        maxResultsPerGroup,
        onSelect,
        onClear,
        onReady,
        onDisposed
    } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const map = useMapModelValue(props);
    const intl = useIntl();
    const controller = useController(sources, searchTypingDelay, maxResultsPerGroup, map);
    const { input, search, onInputChanged, onResultConfirmed } =
        useSearchState(controller);
    
    // Create the collection for the combobox and keep it synced with search results.
    const collection = useSearchCollection(search);
    
    const portalDiv = useRef<HTMLDivElement>(null);
    
    //event hooks for handling input changes, clearing input and selecting options
    const { handleInputChange, clearInput, handleSelectChange } = useSearchHandlers(
        onInputChanged,
        onResultConfirmed,
        onClear,
        onSelect
    );
    // api trigger hooks
    useSearchApi(onReady, onDisposed, clearInput, onInputChanged);

    //render the result list or loading spinner based on search state
    const { showResultOrLoading } = useResultList(collection, input, search, intl);
    
    return (
        <Box {...containerProps} width={"100%"}>
            <Combobox.Root
                collection={collection}
                onInputValueChange={(e) => handleInputChange(e)}
                onValueChange={(e) => handleSelectChange(e)}
                inputValue={input}
                className="search-conbobox-component"
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                placeholder={props.placeholder ?? intl.formatMessage({ id: "searchPlaceholder" })}
                openOnClick={input.length > 0}
            >
                <Combobox.Control>
                    <InputGroup startElement={<Icon position="absolute" left="8px" boxSize="1.25em">
                        <LuSearch />
                    </Icon>}>
                        <Combobox.Input/>
                    </InputGroup>
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                    </Combobox.IndicatorGroup>
                </Combobox.Control>

                <Portal>
                    <Combobox.Positioner>
                        <Combobox.ItemGroup>
                            <Combobox.Content minW="sm" overflowX="hidden">
                                {showResultOrLoading}
                            </Combobox.Content>
                        </Combobox.ItemGroup>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>
            <Portal>
                <chakra.div ref={portalDiv} className="search-component-menu" />
            </Portal>
        </Box>
    );
};

function useSearchCollection(search: SearchResultsState) {
    const { collection, set } = useListCollection<SearchOption>({
        initialItems: [],
        itemToString: (item) => item?.label || "",
        itemToValue: (item) => item?.value || "",
        groupBy: (item) => item.source.label
    });

    useEffect(() => {
        if (search.kind === "ready") {
            const allSearchResults = search.results.flatMap(
                (searchGroupItem) => searchGroupItem.options
            );
            set(allSearchResults);
        }
    }, [search, set]);

    return collection;
}

function useSearchHandlers(
    onInputChanged: (newValue: string) => void,
    onResultConfirmed: (option: SearchOption) => void,
    onClear: ((event: SearchClearEvent) => void) | undefined,
    onSelect: ((event: SearchSelectEvent) => void) | undefined
) {
    const handleInputChange = useEvent((e: ComboboxInputValueChangeDetails) => {
        // Only update the input if the user actually typed something.
        // This keeps the input content if the user focuses another element or if the menu is closed.
        if (e.reason === "input-change") {
            onInputChanged(e.inputValue);
        }
    });

    const clearInput = useEvent((trigger: SearchClearTrigger) => {
        // Updates the input field
        onInputChanged("");
        onClear?.({ trigger: trigger });
    });

    const handleSelectChange = useEvent((e: ComboboxValueChangeDetails<SearchOption>) => {
        const selectedItem = e.items.length ? e.items[0] : clearInput("user");
        if (!selectedItem) {
            return;
        }
        onResultConfirmed(selectedItem);
        onSelect?.({
            source: selectedItem.source,
            result: selectedItem.result
        });
    });

    return { handleInputChange, clearInput, handleSelectChange };
}

function useResultList(collection: ListCollection<SearchOption>, input: string, search: SearchResultsState, intl: PackageIntl) {

    const [groupHeadingBg, focussedItemBg, selectedItemBg] = useToken("colors", [
        "colorPalette.100",
        "colorPalette.50",
        "colorPalette.500"
    ]);


    return useMemo(() => {
        const searchResults = () => {
            return collection.group().map((groupElement, key) => {
                return (
                    <Fragment key={key}>
                        <Combobox.ItemGroupLabel key={groupElement[0]} backgroundColor={groupHeadingBg} padding={"8px 12px"}>
                            {groupElement[0]}
                        </Combobox.ItemGroupLabel>
                        {groupElement[1].map((searchResult, key) => {
                            return (
                                <Combobox.Item key={key} item={searchResult}
                                    // _checked={{ backgroundColor: selectedItemBg }}
                                    // _selected={{ backgroundColor: focussedItemBg }}
                                >
                                    <Combobox.ItemText>
                                        <Highlight
                                            ignoreCase
                                            query={input}
                                            styles={{ fontWeight: "bold" }}
                                        >
                                            {searchResult?.label}
                                        </Highlight>
                                    </Combobox.ItemText>
                                </Combobox.Item>
                            );
                        })}
                    </Fragment>
                );
            });
        };
        
        const showResultOrLoading = search.kind === "ready" ? (
            <Fragment>
                {
                    <Combobox.Empty>
                        {intl.formatMessage({ id: "noOptionsText" })}
                    </Combobox.Empty>
                }
                {searchResults()}
            </Fragment>
        ) : (
            <HStack p="2">
                <Spinner size="xs" borderWidth="1px" />
                <Span>{intl.formatMessage({ id: "loadingText" })}</Span>
            </HStack>
        );

        return { showResultOrLoading };
    }, [collection, groupHeadingBg, input, intl, search.kind]);


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

type SearchResultsReady = {
    kind: "ready";
    results: SearchGroupOption[];
};

type SearchResultsLoading = {
    kind: "loading";
};

type SearchResultsState = SearchResultsReady | SearchResultsLoading;

/**
 * Keeps track of the current input text, active searches and their results.
 *
 * NOTE: it would be great to merge this state handling with the search controller
 * in a future revision.
 */
function useSearchState(controller: SearchController | undefined) {
    interface FullSearchState {
        query: string;
        selectedOption: SearchOption | null;
        search: SearchResultsState;
    }

    type Action =
        | { kind: "input"; query: string }
        | { kind: "select-option"; option: SearchOption }
        | { kind: "load-results" }
        | { kind: "accept-results"; results: SearchGroupOption[] };

    const [state, dispatch] = useReducer(
        (current: FullSearchState, action: Action): FullSearchState => {
            switch (action.kind) {
                case "input":
                    return {
                        ...current,
                        query: action.query,
                        selectedOption: null
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
            selectedOption: null,
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
        const promise = (currentSearch.current = search(controller, query).then((results) => {
            // Check if this job is still current
            if (currentSearch.current === promise) {
                dispatch({ kind: "accept-results", results });
            }
        }));
    });

    // Called when the user confirms a search result
    const onResultConfirmed = useCallback((option: SearchOption) => {
        // Do not start a new search when the user confirms a result
        dispatch({ kind: "select-option", option });
    }, []);

    // Called when a user types into the input field
    const onInputChanged = useCallback(
        (newValue: string) => {
            // Trigger a new search if the user changes the query by typing
            dispatch({ kind: "input", query: newValue });
            startSearch(newValue);
        },
        [startSearch]
    );

    return {
        input: state.query,
        search: state.search,
        selectedOption: state.selectedOption,
        onResultConfirmed,
        onInputChanged
    };
}

async function search(controller: SearchController, query: string): Promise<SearchGroupOption[]> {
    let suggestions: SuggestionGroup[];
    try {
        suggestions = await controller.search(query);
    } catch (error) {
        if (!isAbortError(error)) {
            LOG.error(`Search failed`, error);
        }
        suggestions = [];
    }
    return mapSuggestions(suggestions);
}

function mapSuggestions(suggestions: SuggestionGroup[]): SearchGroupOption[] {
    const options = suggestions.map(
        (group, groupIndex): SearchGroupOption => ({
            label: group.label,
            options: group.results.map((suggestion): SearchOption => {
                return {
                    value: `${groupIndex}-${suggestion.id}`,
                    label: suggestion.label,
                    source: group.source,
                    result: suggestion
                };
            })
        })
    );
    return options;
}

// Note: `clearInput` and `setInputValue` must be stable because only the initial value is used to construct the API instance at this time.
function useSearchApi(
    onReady: ((event: SearchReadyEvent) => void) | undefined,
    onDisposed: ((event: SearchDisposedEvent) => void) | undefined,
    clearInput: (trigger: SearchClearTrigger) => void,
    setInputValue: (newValue: string) => void
) {
    const apiRef = useRef<SearchApi>(null);
    if (!apiRef.current) {
        apiRef.current = new SearchApiImpl(clearInput, setInputValue);
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

