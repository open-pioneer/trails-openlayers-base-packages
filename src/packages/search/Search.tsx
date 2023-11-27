// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, useToken } from "@open-pioneer/chakra-integration";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import {
    ActionMeta,
    AriaOnChange,
    AriaOnFocus,
    AsyncSelect,
    ChakraStylesConfig,
    SelectInstance,
    SingleValue
} from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useRef, useState } from "react";
import {
    ClearIndicator,
    HighlightOption,
    LoadingMessage,
    MenuComp,
    NoOptionsMessage,
    ValueContainer
} from "./CustomComponents";
import { SearchController, SuggestionGroup } from "./SearchController";
import { DataSource, Suggestion } from "./api";

const LOG = createLogger("search:Search");
const DEFAULT_TYPING_DELAY = 500;

export interface SearchOption {
    /** Unique value for this option. */
    value: string;

    /** Display text shown in menu. */
    label: string;

    /** Data source that returned the suggestion. */
    source: DataSource;

    /** The raw result from the search source. */
    suggestion: Suggestion;
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
    /** The source that returned the {@link suggestion}. */
    source: DataSource;

    /** The search result selected by the user. */
    suggestion: Suggestion;
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
    sources: DataSource[];

    /**
     * Typing delay (in milliseconds) before the async search query starts after the user types in the search term.
     * default value: 500
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

export const Search: FC<SearchProps> = (props) => {
    const { mapId, sources, searchTypingDelay, onSelect, onClear } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    const controller = useController(sources, searchTypingDelay || DEFAULT_TYPING_DELAY, map);

    const loadOptions = async (inputValue: string): Promise<SearchGroupOption[]> => {
        let suggestions: SuggestionGroup[];
        try {
            suggestions = await controller!.search(inputValue);
        } catch (error) {
            if (!isAbortError(error)) {
                LOG.error(`Search failed`, error);
            }
            suggestions = [];
        }
        return mapSuggestions(suggestions);
    };

    const [groupHeadingBg, focussedItemBg] = useToken(
        "colors",
        ["trails.100", "trails.50"],
        ["#d5e5ec", "#eaf2f5"]
    );

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
            display: "none"
        })
    };

    const onInputChange = (
        value: SingleValue<SearchOption>,
        actionMeta: ActionMeta<SearchOption>
    ) => {
        switch (actionMeta.action) {
            case "select-option":
                if (value) {
                    onSelect?.({
                        source: value.source,
                        suggestion: value.suggestion
                    });
                }
                break;
            case "clear":
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

    const selectRef = useRef<SelectInstance<SearchOption, false, SearchGroupOption>>(null);
    return (
        <Box {...containerProps}>
            <AsyncSelect<SearchOption, false, SearchGroupOption>
                className="search-component"
                classNamePrefix="react-select"
                ref={selectRef}
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                ariaLiveMessages={{
                    onFocus,
                    onChange,
                    guidance,
                    onFilter
                }}
                colorScheme="trails"
                selectedOptionStyle="color"
                selectedOptionColorScheme="trails"
                chakraStyles={chakraStyles}
                isClearable={true}
                placeholder={intl.formatMessage({ id: "searchPlaceholder" })}
                closeMenuOnSelect={true}
                loadOptions={loadOptions}
                components={{
                    Option: HighlightOption,
                    NoOptionsMessage: NoOptionsMessage,
                    Menu: MenuComp,
                    LoadingMessage: LoadingMessage,
                    ValueContainer: ValueContainer,
                    ClearIndicator: ClearIndicator
                }}
                onChange={onInputChange}
            />
        </Box>
    );
};

function useController(
    sources: DataSource[],
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

function mapSuggestions(suggestions: SuggestionGroup[]): SearchGroupOption[] {
    const options = suggestions.map(
        (group, groupIndex): SearchGroupOption => ({
            label: group.label,
            options: group.suggestions.map((suggestion): SearchOption => {
                return {
                    value: `${groupIndex}-${suggestion.id}`,
                    label: suggestion.label,
                    source: group.source,
                    suggestion
                };
            })
        })
    );
    return options;
}
