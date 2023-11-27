// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, useToken } from "@open-pioneer/chakra-integration";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import {
    ActionMeta,
    AriaLiveMessages,
    AriaOnChange,
    AriaOnFocus,
    ChakraStylesConfig,
    InputActionMeta,
    Select,
    SelectInstance,
    SingleValue,
    Props as SelectProps
} from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ClearIndicator,
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
import { SearchSource, SearchResult } from "./api";
import { PackageIntl } from "@open-pioneer/runtime";

const LOG = createLogger("search:Search");
const DEFAULT_TYPING_DELAY = 100;

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
 * Event type emitted when the user selects an item.
 */
export interface SearchSelectEvent {
    /** The source that returned the {@link result}. */
    source: SearchSource;

    /** The search result selected by the user. */
    result: SearchResult;
}

/**
 * Properties supported by the {@link Search} component.
 */
export interface SearchProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Data sources to be searched on.
     */
    sources: SearchSource[];

    /**
     * Typing delay (in milliseconds) before the async search query starts after the user types in the search term.
     * Default value: 100
     */
    searchTypingDelay?: number;

    /**
     * TODO
     */
    maxResultsPerSource?: number;

    /**
     * This event handler will be called when the user selects a search result.
     */
    onSelect?: (event: SearchSelectEvent) => void;

    /**
     * This event handler will be called when the user clears the search input.
     */
    onClear?: () => void;
}

/**
 * A component that allows the user to search a given set of {@link SearchSource | SearchSources}.
 */
export const Search: FC<SearchProps> = (props) => {
    const { mapId, sources, searchTypingDelay = DEFAULT_TYPING_DELAY, onSelect, onClear } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const controller = useController(sources, searchTypingDelay, map);
    const { input, results, onInputChanged, onResultConfirmed } = useSearchState(controller);

    const handleInputChange = useEvent((newValue: string, actionMeta: InputActionMeta) => {
        // Only update the input if the user actually typed something.
        // This keeps the input content if the user focuses another element or if the menu is closed.
        if (actionMeta.action === "input-change") {
            onInputChanged(newValue);
        }
    });

    const chakraStyles = useChakraStyles();
    const ariaMessages = useAriaMessages(intl);
    const components = useCustomComponents();

    const handleSelectChange = (
        value: SingleValue<SearchOption>,
        actionMeta: ActionMeta<SearchOption>
    ) => {
        switch (actionMeta.action) {
            case "select-option":
                if (value) {
                    // Updates the input field with the option label
                    onResultConfirmed(value);
                    onSelect?.({
                        source: value.source,
                        result: value.result
                    });
                }
                break;
            case "clear":
                // Updates the input field
                onInputChanged("");

                // the next two lines are a workaround for the open bug in react-select regarding the
                // cursor not being shown after clearing, although the component is focussed:
                // https://github.com/JedWatson/react-select/issues/3871
                selectRef.current?.blur();
                selectRef.current?.focus();
                onClear?.();
                break;
            default:
                LOG.debug(`Unhandled action type '${actionMeta.action}'.`);
                break;
        }
    };

    const selectRef = useRef<SelectInstance<SearchOption, false, SearchGroupOption>>(null);
    return (
        <Box {...containerProps}>
            <Select<SearchOption, false, SearchGroupOption>
                className="search-component"
                classNamePrefix="react-select"
                ref={selectRef}
                inputValue={input}
                onInputChange={handleInputChange}
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                ariaLiveMessages={ariaMessages}
                colorScheme="trails"
                selectedOptionStyle="color"
                selectedOptionColorScheme="trails"
                chakraStyles={chakraStyles}
                isClearable={true}
                placeholder={intl.formatMessage({ id: "searchPlaceholder" })}
                closeMenuOnSelect={true}
                isLoading={results.kind === "loading"}
                options={results.kind === "ready" ? results.results : undefined}
                filterOption={() => true} // always show all options (don't filter based on input text)
                tabSelectsValue={false}
                components={components}
                onChange={handleSelectChange}
            />
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
        const onFocus: AriaOnFocus<SearchOption> = ({ focused }) => {
            return `${focused.label} ${intl.formatMessage({ id: "ariaLabel.searchFocus" })}.`;
        };

        /**
         * Method to create Aria-String for value-change-Event
         */
        const onChange: AriaOnChange<SearchOption, boolean> = ({ action, label }) => {
            let message = "";
            switch (action) {
                case "select-option":
                    message = `${label} ${intl.formatMessage({ id: "ariaLabel.searchSelect" })}.`;
                    break;
                case "clear":
                    message = `${label} ${intl.formatMessage({ id: "ariaLabel.searchClear" })}.`;
                    break;
                default:
                    break;
            }
            return message;
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
            ClearIndicator: ClearIndicator
        };
    }, []);
}

/**
 * Customizes components styles within the select component.
 */
function useChakraStyles() {
    const [groupHeadingBg, focussedItemBg] = useToken(
        "colors",
        ["trails.100", "trails.50"],
        ["#d5e5ec", "#eaf2f5"]
    );
    return useMemo(() => {
        const chakraStyles: ChakraStylesConfig<SearchOption, false, SearchGroupOption> = {
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
                _focus: {
                    backgroundColor: focussedItemBg
                }
            }),
            dropdownIndicator: (provided) => ({
                ...provided,
                display: "none" // always hide
            })
        };
        return chakraStyles;
    }, [groupHeadingBg, focussedItemBg]);
}

/**
 * Creates a controller to search on the given sources.
 */
function useController(
    sources: SearchSource[],
    searchTypingDelay: number,
    map: MapModel | undefined
) {
    const [controller, setController] = useState<SearchController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }
        const controller = new SearchController({ sources, searchTypingDelay });
        setController(controller);
        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, sources, searchTypingDelay]);

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

interface InputState {
    query: string;
}

/**
 * Keeps track of the current input text, active searches and their results.
 *
 * NOTE: it would be great to merge this state handling with the search controller
 * in a future revision.
 */
function useSearchState(controller: SearchController | undefined) {
    const [resultsState, setResultsState] = useState<SearchResultsState>(() => {
        return { kind: "ready", results: [] };
    });
    const [inputState, setInputState] = useState<InputState>(() => {
        return { query: "" };
    });

    const currentSearch = useRef<Promise<unknown>>();
    const startSearch = useEvent((query: string) => {
        if (!controller || !query) {
            currentSearch.current = undefined;
            setResultsState({ kind: "ready", results: [] });
            return;
        }

        LOG.isDebug() && LOG.debug(`Starting new search for query ${JSON.stringify(query)}.`);
        setResultsState({ kind: "loading" });
        const promise = (currentSearch.current = search(controller, query).then((results) => {
            // Check if this job is still current
            if (currentSearch.current === promise) {
                setResultsState({ kind: "ready", results });
            }
        }));
    });

    // Called when the user confirms a search result
    const onResultConfirmed = useCallback((option: SearchOption) => {
        // Do not start a new search when the user confirms a result
        setInputState({ query: option.label });
    }, []);

    // Called when a user types into the input field
    const onInputChanged = useCallback(
        (newValue: string) => {
            // Trigger a new search if the user changes the query by typing
            setInputState({ query: newValue });
            startSearch(newValue);
        },
        [startSearch]
    );

    return {
        input: inputState.query,
        results: resultsState,
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
            options: group.suggestions.map((suggestion): SearchOption => {
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
