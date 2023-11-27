// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { DataSource, Suggestion } from "./api";
import { FC, useEffect, useRef, useState } from "react";
import { ActionMeta, AsyncSelect, SelectInstance, SingleValue } from "chakra-react-select";
import { AriaOnFocus, AriaOnChange, OptionProps } from "react-select";
import { SearchController, SuggestionGroup } from "./SearchController";
import {
    LoadingMessage,
    MenuComp,
    NoOptionsMessage,
    HighlightOption,
    ValueContainer,
    ClearIndicator
} from "./CustomComponents";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { useIntl } from "open-pioneer:react-hooks";
import { Box } from "@open-pioneer/chakra-integration";
import { useTheme } from "@open-pioneer/chakra-integration";

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
     * Whether the dropdown indicator should be displayed (combo box arrow).
     * default value: false
     */
    showDropdownIndicator?: boolean;

    /**
     * Background-Color Style to be used for group headings (css-style string)
     * default value: is pulled from the trails theme (trails.100)
     */
    groupHeadingBackgroundColor?: string;

    /**
     * Background-Color Style to be used for the currently focussed search item (css-style string)
     * default value: is pulled from the trails theme (trails.50)
     */
    focussedItemBackgroundColor?: string;

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
    const {
        mapId,
        sources,
        searchTypingDelay,
        showDropdownIndicator,
        focussedItemBackgroundColor,
        groupHeadingBackgroundColor,
        onSelect,
        onClear
    } = props;
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
                LOG.error(`search fail`, error);
            }
            suggestions = [];
        }
        return mapSuggestions(suggestions);
    };

    // TODO: Hardcoded name for the theme is no good, needs to be more flexible
    const theme = useTheme();
    const defaultGroupHeadingBackgroundColor = theme.colors.trails
        ? theme.colors.trails[100]
        : "#d5e5ec";
    // Sadly, the property 'selectedOptionColorScheme' does not seem to work with custom 'option'
    // component. Therefor we have to set the color from theme manually (no automatic
    // dark mode support anymore)
    const defaultFocussedItemBackgroundColor = theme.colors.trails
        ? theme.colors.trails[50]
        : "#eaf2f5";

    const displayCss = showDropdownIndicator ? "inherit" : "none";
    const chakraStyles = {
        groupHeading: (provided: object) => ({
            ...provided,
            backgroundColor: groupHeadingBackgroundColor || defaultGroupHeadingBackgroundColor,
            padding: "8px 12px",
            // make Header look like normal options:
            fontSize: "inherit",
            fontWeight: "inherit"
        }),
        dropdownIndicator: (provided: object) => ({
            ...provided,
            display: displayCss
        })
    };

    // Workaround: It seems like, some css properties like padding or backgroundColor cannot be set
    // on chakraStyles when custom components are being used. It is passed as the "styles" object
    const styles = {
        option: (provided: object, state: OptionProps<SearchOption, false, SearchGroupOption>) => ({
            ...provided,
            padding: "8px 24px",
            backgroundColor: state.isFocused
                ? focussedItemBackgroundColor || defaultFocussedItemBackgroundColor
                : "inherit"
        })
    };

    //Typescript doesn't recognize Type SearchOption but rather SingleValue<SearchGroupOption>
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
                LOG.debug("No event handler defined or unknown actiontype");
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
                ref={selectRef}
                aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                ariaLiveMessages={{
                    onFocus,
                    onChange,
                    guidance,
                    onFilter
                }}
                /* selectedOptionColorScheme="trails" 
                    --> unfortunately does not work when a custom component is used as "option" */
                styles={styles}
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
