// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    CloseButton,
    Combobox,
    ComboboxInputValueChangeDetails,
    ComboboxValueChangeDetails,
    createListCollection,
    Highlight,
    HStack,
    Icon,
    InputGroup,
    ListCollection,
    Portal,
    Span,
    Spinner,
    useToken
} from "@chakra-ui/react";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, Fragment, UIEvent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
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
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";

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
export const Search: FC<SearchProps> = (props) => {
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
    const { input, search, onInputChanged, onResultConfirmed, selectedOption } = useSearchState(controller);

    // Create the collection for the combobox and keep it synced with search results.
    const collection = useSearchCollection(search);

    //event hooks for handling input changes, clearing input and selecting options
    const { handleInputChange, clearInput, handleSelectChange } = useSearchHandlers(
        onInputChanged,
        onResultConfirmed,
        onClear,
        onSelect
    );
    // api trigger hooks
    useSearchApi(onReady, onDisposed, clearInput, onInputChanged);

    // Workaround for buggy Combobox behavior selectionBehavior="preserve" (dont clear input on outside click)
    // the combobox sometimes looses input change trigger and is not usable, until clicked somewhere else
    // if we control the open state here, we can at least ensure that the search is working as intented
    // TO consider: remove when chakra ui fixes the issue
    const [openState, setOpenState] = useState<boolean>(true); 

    return (
        <Box {...containerProps} width={"100%"}>
            <Combobox.Root
                collection={collection}
                onInputValueChange={(e) => {
                    handleInputChange(e);
                    setOpenState(true);
                }}
                onValueChange={(e) => {
                    handleSelectChange(e);
                    setOpenState(false);
                }}
                inputValue={input}
                value={selectedOption?.value ? [selectedOption.value] : []}
                className="search-combobox-component"
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                placeholder={props.placeholder ?? intl.formatMessage({ id: "searchPlaceholder" })}
                openOnClick={input.length > 0}
                lazyMount={true}
                unmountOnExit={true}
                // selectionBehavior="preserve"
                onPointerDownOutside={(e) => {
                    e.preventDefault();
                    setOpenState(false);
                }} // prevents deleting inputtext on outside click, alternative to selectionBehavior="preserve"
                open={openState}
                onClick={() => {
                    setOpenState(true);
                }}
            >
                {AccessibleBoxHelper(search)}
                <Combobox.Control>
                    <InputGroup
                        startElement={
                            <Icon className={"search-icon"} size="md">
                                <LuSearch />
                            </Icon>
                        }
                    >
                        <Combobox.Input />
                    </InputGroup>
                    <Combobox.IndicatorGroup>
                        {search.kind === "loading" ? (
                        <Spinner size="xs" borderWidth="1px" />
                        ) : input.length ? (
                        <CustomClearIndicator
                            clearValue={() => {
                                clearInput("user");
                            }}
                        />
                        ) : null}
                    </Combobox.IndicatorGroup>
                </Combobox.Control>

                <Portal>
                    <Combobox.Positioner>
                        <Combobox.ItemGroup>
                            <Combobox.Content minW="sm" overflowX="hidden" visibility={input.length ? "visible" : "hidden"}>
                                <Fragment>
                                    <LoadingOrEmptyIndicator search={search} />
                                    <ResultList collection={collection} input={input} search={search} />
                                </Fragment>
                            </Combobox.Content>
                        </Combobox.ItemGroup>
                    </Combobox.Positioner>
                </Portal>
            </Combobox.Root>
        </Box>
    );
};

/**
 * Report loading status for screen readers.
 */
function AccessibleBoxHelper(search: SearchResultsState ) {
    const intl = useIntl();
    const loadingLabel = intl.formatMessage({ id: "loadingText" });
    const resultsloaded = intl.formatMessage({ id: "resultLoaded" });
    return (
        <Box position="absolute" width="1px" height="1px" overflow="hidden" clip="rect(1px, 1px, 1px, 1px)">
                <span aria-live="polite">
                    {search.kind === "ready" ? resultsloaded : search.kind === "loading" ? loadingLabel : ""}
                </span>
        </Box>
    );
}

/**
 * Show loading label or empty Result.
 */
function LoadingOrEmptyIndicator(props: { search: SearchResultsState }) {
    const intl = useIntl();
    const loadingLabel = intl.formatMessage({ id: "loadingText" });
    const noOptionLabel = intl.formatMessage({ id: "noOptionsText" });
    return (
        <Combobox.Empty padding="0">
            <HStack p="2" justifyContent="center">
                {props.search.kind === "loading" ? (
                    <Fragment>
                        <Span>{loadingLabel}</Span>
                    </Fragment>
                ) : (
                    <Span>{noOptionLabel}</Span>
                )}
            </HStack>
        </Combobox.Empty>
    );
}

function CustomClearIndicator(props: { clearValue: () => void }) {
    const intl = useIntl();
    const clearButtonLabel = intl.formatMessage({
        id: "ariaLabel.clearButton"
    });
    const clickHandler = (e: UIEvent) => {
        e.preventDefault();
        e.stopPropagation();
        props.clearValue();
    };

    return (
        <Tooltip content={clearButtonLabel}>
            <CloseButton 
                variant="ghost"
                mr="-10px"
                size="sm"
                aria-label={clearButtonLabel}
                onClick={clickHandler}
                onTouchEnd={clickHandler}
                // Stop select component from opening the menu.
                // It will otherwise flash briefly because of a mouse down listener in the select.
                onMouseDown={(e) => e.preventDefault()}  />
        </Tooltip>
    );
}

function useSearchCollection(search: SearchResultsState) {
    return useMemo(() => {
        if (search.kind === "ready") {
            const options = search.results.flatMap((group) => group.options);
            return createListCollection({
                items: options,
                groupBy: (item) => item.source.label,
                itemToString: (item) => item?.label || "",
                itemToValue: (item) => item?.value || ""
            });
        }
        return createListCollection<SearchOption>({ items: [] });
    }, [search]);
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
        if (e.reason === "input-change" || e.reason === "interact-outside") {
            onInputChanged(e.inputValue);
        }
    });

    const clearInput = useEvent((trigger: SearchClearTrigger) => {
        // Updates the input field
        onInputChanged("");
        onClear?.({ trigger: trigger });
    });

    const handleSelectChange = useEvent((e: ComboboxValueChangeDetails<SearchOption>) => {
        const selectedItem = e.items.length ? e.items[0] : null;
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

function ResultList(props: { collection: ListCollection<SearchOption>; input: string, search: SearchResultsState }) {
    const { collection, input, search } = props;
    const [groupHeadingBg, focussedItemBg, selectedItemBg] = useToken("colors", [
        "colorPalette.100",
        "colorPalette.50",
        "colorPalette.500"
    ]);
    return collection.group().map((groupElement, key) => {
        return (
            <Fragment key={key}>
                <Combobox.ItemGroupLabel
                    key={groupElement[0]}
                    backgroundColor={groupHeadingBg}
                    visibility={search.kind === "loading" ? "hidden" : "visible"}
                >
                    {groupElement[0]}
                </Combobox.ItemGroupLabel>
                {groupElement[1].map((searchResult, key) => {
                    return (
                        <Combobox.Item
                            key={key}
                            item={searchResult}
                            style={
                                searchResult?.label === input
                                    ? { backgroundColor: selectedItemBg, color: "white" }
                                    : undefined
                            }
                            _hover={{ backgroundColor: focussedItemBg }}
                        >
                            
                            <Combobox.ItemText>
                                <Highlight ignoreCase query={input} styles={{ fontWeight: "bold" }}>
                                    {searchResult?.label}
                                </Highlight>
                            </Combobox.ItemText>
                        </Combobox.Item>
                    );
                })}
            </Fragment>
        );
    });
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
    return suggestions.map(
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
