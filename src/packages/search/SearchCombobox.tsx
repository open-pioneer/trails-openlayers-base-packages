// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    chakra,
    CloseButton,
    Combobox,
    Highlight,
    HStack,
    Icon,
    InputGroup,
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
import {
    AriaLiveMessages,
    AriaOnChange,
    AriaOnFocus,
    ChakraStylesConfig,
    Props as SelectProps,
} from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, Fragment, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
    ClearIndicator,
    GroupComp,
    HighlightOption,
    IndicatorsContainer,
    Input,
    LoadingMessage,
    MenuComp,
    NoOptionsMessage,
    SingleValue as SingleValueComp,
    ValueContainer
} from "./CustomComponents";
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
import {
    InputValueChangeDetails,
    ValueChangeDetails
} from "@chakra-ui/react/dist/types/components/combobox/namespace";
import { LuSearch, LuX } from "react-icons/lu";

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
    const { input, search, selectedOption, onInputChanged, onResultConfirmed } =
        useSearchState(controller);

    const [groupHeadingBg, focussedItemBg, selectedItemBg] = useToken("colors", [
        "colorPalette.100",
        "colorPalette.50",
        "colorPalette.500"
    ]);
    
    const chakraStyles = useChakraStyles();
    const ariaMessages = useAriaMessages(intl);
    const components = useCustomComponents();

    const portalDiv = useRef<HTMLDivElement>(null);

    const handleInputChange = useEvent((e: InputValueChangeDetails) => {
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

    const handleSelectChange = useEvent((e: ValueChangeDetails<SearchOption>) => {
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

    useSearchApi(onReady, onDisposed, clearInput);

    const { collection, set } = useListCollection<SearchOption>({
        initialItems: [],
        itemToString: (item) => item?.label || "",
        itemToValue: (item) => item?.value || "",
        groupBy: (item) => item.source.label
    });

    // combodata
    useEffect(() => {
        if (search.kind === "ready") {
            const allSearchResults = search.results.flatMap(
                (searchGroupItem) => searchGroupItem.options
            );
            set(allSearchResults);
        }
    }, [search, set]);

    const searchResults = useMemo(() => {
        return collection.group().map((groupElement, key) => {
            return (
                <Fragment key={key}>
                    <Combobox.ItemGroupLabel key={groupElement[0]} backgroundColor={groupHeadingBg} padding={"8px 12px"} 
                    >
                        {groupElement[0]}
                    </Combobox.ItemGroupLabel>
                    {groupElement[1].map((searchResult, key) => {
                        return (
                            <Combobox.Item key={key} item={searchResult} _checked={{ backgroundColor: selectedItemBg }} _selected={{ backgroundColor: focussedItemBg }}>
                                <Combobox.ItemText>
                                    <Highlight
                                        ignoreCase
                                        query={input}
                                        styles={{ fontWeight: "bold" }}
                                    >
                                        {searchResult?.label}
                                    </Highlight>
                                </Combobox.ItemText>
                                <Combobox.ItemIndicator />
                            </Combobox.Item>
                        );
                    })}
                </Fragment>
            );
        });
    }, [collection, focussedItemBg, input, selectedItemBg]);
    
    const loading = useMemo(() =>  {
        if (search.kind === "loading") {
            return (<HStack p="2">
                <Spinner size="xs" borderWidth="1px" />
            </HStack>);
        }
        
    },[search.kind]);
    
    const showResultOrState = useMemo(() => {
        if (search.kind === "ready") {
            return (
                <Fragment>
                    <Combobox.Empty>
                        {intl.formatMessage({ id: "noOptionsText" })}
                    </Combobox.Empty>
                    {searchResults}
                </Fragment>
            );
        }  else {
            return <Span>{intl.formatMessage({ id: "loadingText" })}</Span>;
        }
    }, [intl, search.kind, searchResults]);
    
    return (
        <Box {...containerProps}>
            <Combobox.Root
                collection={collection}
                onInputValueChange={(e) => handleInputChange(e)}
                onValueChange={(e) => handleSelectChange(e)}
                inputValue={input}
                className="search-conbobox-component"
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                placeholder={props.placeholder ?? intl.formatMessage({ id: "searchPlaceholder" })}
                // ariaLiveMessages={ariaMessages}
                // chakraStyles={chakraStyles}
            >
                <Combobox.Control>
                    <InputGroup startElement={<Icon position="absolute" left="8px" boxSize="1.25em">
                        <LuSearch />
                    </Icon>}>
                        <Combobox.Input/>
                    </InputGroup>
                    <Combobox.IndicatorGroup>
                        <Combobox.ClearTrigger />
                        {loading}
                    </Combobox.IndicatorGroup>
                </Combobox.Control>

                <Portal>
                    <Combobox.Positioner>
                        <Combobox.ItemGroup>
                            <Combobox.Content minW="sm">
                                {showResultOrState}
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

/**
 * Provides custom aria messages for the select component.
 */
function useAriaMessages(
    intl: PackageIntl
): AriaLiveMessages<SearchOption, false, SearchGroupOption> {
    return useMemo(() => {
        /**
         * Method to create Aria-String for focus-Event
         */
        const onFocus: AriaOnFocus<SearchOption> = () => {
            //no aria string for focus-events because in some screen readers (NVDA) and browsers (Chrome) updating the aria string causes the instructions to be read out again each time a select option is focused
            return "";
        };

        /**
         * Method to create Aria-String for value-change-Event
         */
        const onChange: AriaOnChange<SearchOption, boolean> = () => {
            //no aria string for change-events because in some screen readers (NVDA) and browsers (Chrome) updating the aria string causes the instructions to be read out again each time a select option is focused
            return "";
        };

        /**
         * Method to create Aria-String for instruction
         */
        const guidance = () => {
            return `${intl.formatMessage({ id: "ariaLabel.instructions" })}`;
        };

        /**
         * Method to create Aria-String for result length
         */
        const onFilter = () => {
            return "";
        };

        return {
            onFocus,
            onChange,
            guidance,
            onFilter
        };
    }, [intl]);
}

/**
 * Customizes the inner components used by the select component.
 */
function useCustomComponents(): SelectProps<SearchOption, false, SearchGroupOption>["components"] {
    return useMemo(() => {
        return {
            Menu: MenuComp,
            Input: Input,
            SingleValue: SingleValueComp,
            Option: HighlightOption,
            NoOptionsMessage: NoOptionsMessage,
            LoadingMessage: LoadingMessage,
            ValueContainer: ValueContainer,
            IndicatorsContainer: IndicatorsContainer,
            ClearIndicator: ClearIndicator,
            Group: GroupComp
        };
    }, []);
}

/**
 * Customizes components styles within the select component.
 */
function useChakraStyles() {
    const [groupHeadingBg, focussedItemBg, selectedItemBg] = useToken("colors", [
        "colorPalette.100",
        "colorPalette.50",
        "colorPalette.500"
    ]);
    return useMemo(() => {
        const chakraStyles: ChakraStylesConfig<SearchOption, false, SearchGroupOption> = {
            control: (provided) => ({
                ...provided,
                paddingInline: 0
            }),
            inputContainer: (provided) => ({
                ...provided,
                gridTemplateAreas: "'area area area'",
                display: "grid"
            }),
            indicatorsContainer: (provided) => ({
                ...provided,
                // pointerEvents none can sneak in via chakra theme from <Select />
                pointerEvents: "auto"
            }),
            input: (provided) => ({
                ...provided,
                gridArea: "area"
            }),
            groupHeading: (provided) => ({
                ...provided,
                backgroundColor: groupHeadingBg,
                padding: "8px 12px",
                // make Header look like normal options:
                fontSize: "inherit",
                fontWeight: "inherit"
            }),
            option: (provided) => ({
                ...provided,
                backgroundColor: "inherit",
                _highlighted: {
                    backgroundColor: focussedItemBg
                },
                _selected: {
                    // Prevent white on white
                    backgroundColor: selectedItemBg
                }
            }),
            dropdownIndicator: (provided) => ({
                ...provided,
                display: "none" // always hide
            })
        };
        return chakraStyles;
    }, [groupHeadingBg, focussedItemBg, selectedItemBg]);
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

// Note: `clearInput` must be stable because only the initial value is used to construct the API instance at this time.
function useSearchApi(
    onReady: ((event: SearchReadyEvent) => void) | undefined,
    onDisposed: ((event: SearchDisposedEvent) => void) | undefined,
    clearInput: (trigger: SearchClearTrigger) => void
) {
    const apiRef = useRef<SearchApi>(null);
    if (!apiRef.current) {
        apiRef.current = new SearchApiImpl(clearInput);
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
