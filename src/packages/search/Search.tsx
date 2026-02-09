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
    VisuallyHidden
} from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import {
    FC,
    Fragment,
    memo,
    UIEvent,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState
} from "react";
import { LuSearch } from "react-icons/lu";
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
import { SearchController, SuggestionGroup } from "./SearchController";

const LOG = createLogger(sourceId);

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
    const { input, search, onInputChanged, onResultConfirmed, selectedOption } =
        useSearchState(controller);

    // NOTE: Search Sources do not have an id at this time, but the UI components need some.
    const getId = useSearchSourceId();

    // Create the collection for the combobox and keep it synced with search results.
    const collection = useSearchCollection(search, getId);

    //event hooks for handling input changes, clearing input and selecting options
    const { handleInputChange, clearInput, handleSelectChange } = useSearchHandlers(
        onInputChanged,
        onResultConfirmed,
        onClear,
        onSelect
    );
    // api trigger hooks
    useSearchApi(onReady, onDisposed, clearInput, onInputChanged);

    return (
        <Box {...containerProps} width={"100%"}>
            <Combobox.Root
                collection={collection}
                onInputValueChange={(e) => {
                    handleInputChange(e);
                }}
                onValueChange={(e) => {
                    handleSelectChange(e);
                }}
                inputValue={input}
                value={selectedOption?.value ? [selectedOption.value] : []}
                className="search-combobox-component"
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                placeholder={props.placeholder ?? intl.formatMessage({ id: "searchPlaceholder" })}
                openOnClick={input.length > 0}
                closeOnSelect={true}
                lazyMount={true}
                unmountOnExit={true}
                selectionBehavior="preserve"
            >
                <AccessibleBoxHelper search={search} />
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
                            <ClearIndicator
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
                            <Combobox.Content
                                className="search-component-menu"
                                minW="sm"
                                overflowX="hidden"
                                visibility={input.length ? "visible" : "hidden"}
                            >
                                <>
                                    <FallbackContent search={search} />
                                    <ResultList
                                        collection={collection}
                                        input={input}
                                        search={search}
                                    />
                                </>
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
const AccessibleBoxHelper = memo(function AccessibleBoxHelper(props: {
    search: SearchResultsState;
}) {
    const { search } = props;
    const intl = useIntl();

    let content;
    if (search.kind === "loading") {
        content = intl.formatMessage({ id: "loadingText" });
    } else if (search.kind === "ready") {
        content = intl.formatMessage({ id: "resultLoaded" });
    }

    return <VisuallyHidden aria-live="polite">{content}</VisuallyHidden>;
});

/**
 * Show loading label or fallback message when no results are found.
 */
const FallbackContent = memo(function FallbackContent(props: { search: SearchResultsState }) {
    const { search } = props;
    const intl = useIntl();

    let content;
    if (search.kind === "loading") {
        content = intl.formatMessage({ id: "loadingText" });
    } else {
        content = intl.formatMessage({ id: "noOptionsText" });
    }

    return (
        <Combobox.Empty padding="0">
            <HStack p="2" justifyContent="center">
                <Span>{content}</Span>
            </HStack>
        </Combobox.Empty>
    );
});

const ClearIndicator = memo(function ClearIndicator(props: { clearValue: () => void }) {
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
            />
        </Tooltip>
    );
});

function useSearchCollection(search: SearchResultsState, getId: GetSearchSourceId) {
    return useMemo(() => {
        if (search.kind === "ready") {
            const options = search.results.flatMap((group) => group.options);
            return createListCollection({
                items: options,
                groupBy: (item) => getId(item.source),
                itemToString: (item) => item?.label || "",
                itemToValue: (item) => item?.value || ""
            });
        }
        return createListCollection<SearchOption>({ items: [] });
    }, [search, getId]);
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

const ResultList = memo(function ResultList(props: {
    collection: ListCollection<SearchOption>;
    input: string;
    search: SearchResultsState;
}) {
    const { collection, input, search } = props;
    return collection.group().map(([groupId, groupOptions], key) => {
        return (
            <Fragment key={key}>
                <Combobox.ItemGroupLabel
                    key={groupId}
                    backgroundColor="colorPalette.100"
                    visibility={search.kind === "loading" ? "hidden" : "visible"}
                >
                    {groupOptions[0]?.source.label}
                </Combobox.ItemGroupLabel>
                {groupOptions.map((searchResult, key) => {
                    return (
                        <Combobox.Item
                            key={key}
                            item={searchResult}
                            css={{
                                _checked: {
                                    backgroundColor: "colorPalette.500",
                                    color: "white"
                                },
                                "&:hover:not([data-state=checked])": {
                                    backgroundColor: "colorPalette.50"
                                }
                            }}
                        >
                            <Combobox.ItemText>
                                <Highlight ignoreCase query={input} styles={{ fontWeight: "bold" }}>
                                    {searchResult.label}
                                </Highlight>
                            </Combobox.ItemText>
                        </Combobox.Item>
                    );
                })}
            </Fragment>
        );
    });
});

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

type GetSearchSourceId = (source: SearchSource) => string;

/**
 * Assigns unique IDs to selection sources.
 */
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
