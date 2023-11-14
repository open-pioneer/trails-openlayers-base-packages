// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import {
    ActionMeta,
    AsyncSelect,
    OptionsOrGroups,
    SelectInstance,
    SingleValue
} from "chakra-react-select";
import { DataSource } from "./api";
import { SearchController } from "./SearchController";
import { debounce, mapSuggestions } from "./utils";
import {
    LoadingMessage,
    MenuComp,
    NoOptionsMessage,
    HighlightOption,
    ValueContainer
} from "./CustomComponents";
import { createLogger, isAbortError } from "@open-pioneer/core";

const LOG = createLogger("search-ui:Search");
const DEFAULT_GROUP_HEADING_BACKGROUND_COLOR = "rgba(211,211,211,0.20)";

export interface SearchOption {
    value: string;
    label: string;
}
export interface SearchGroupOption {
    label: string;
    options: SearchOption[];
    priority?: number;
}

// TODO: The real suggestion should be evented here, not the SearchOption.
//  Maybe the controller should do the work?
export interface SelectSearchEvent {
    action: "select-option";
    suggestion: SearchOption;
}

/**
 * This is for special properties of the Search component
 */
export interface SearchProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Datasources to be searched on
     */
    sources: DataSource[];

    /**
     * Component name
     */
    name?: string;

    /**
     * Default property of the react select component
     */
    closeMenuOnSelect?: boolean;

    /**
     * Typing delay before the async search query starts after the user types in the search term
     */
    searchTypingDelay?: number;

    /**
     * Should the dropdown indicator be displayed (combo box arrow)
     */
    showDropdownIndicator?: boolean;

    /**
     * Background-Color Style to be used for group headings
     */
    groupHeadingBackgroundColor?: string;

    /**
     * Callback function for the select event
     */
    onSelect?: (event: SelectSearchEvent) => void;

    /**
     * Callback function for the clear event
     */
    onClear?: () => void;
}

export const Search: FC<SearchProps> = (props) => {
    const {
        closeMenuOnSelect,
        mapId,
        sources,
        searchTypingDelay,
        showDropdownIndicator,
        groupHeadingBackgroundColor,
        onSelect,
        onClear
    } = props;
    const { map } = useMapModel(mapId);
    const controller = useController(sources, map);

    const debouncedLoadOptions = useMemo(() => {
        const loadOptions = async (inputValue: string): Promise<SearchGroupOption[]> => {
            const suggestions = await controller!.search(inputValue);
            return mapSuggestions(suggestions, sources);
        };

        return debounce(
            async (
                inputValue: string,
                callback: (options: OptionsOrGroups<SearchOption, SearchGroupOption>) => void
            ) => {
                try {
                    const results = await loadOptions(inputValue);
                    callback(results); // <-- Notice we added here the "await" keyword.
                } catch (e) {
                    if (isAbortError(e)) {
                        LOG.debug("Previous searchquery has been canceled by the user.");
                    } else {
                        LOG.error(e);
                    }
                }
            },
            searchTypingDelay
        );
    }, [controller, sources, searchTypingDelay]);

    const displayCss = showDropdownIndicator ? "inherit" : "none";
    const chakraStyles = {
        dropdownIndicator: (provided: object) => ({
            ...provided,
            display: displayCss
        }),
        groupHeading: (provided: object) => ({
            ...provided,
            backgroundColor: groupHeadingBackgroundColor || DEFAULT_GROUP_HEADING_BACKGROUND_COLOR
        })
    };

    //Typescript doesn't recognize Type SearchOption but rather SingleValue<SearchGroupOption>
    const onInputChange = (
        value: SingleValue<SearchOption>,
        actionMeta: ActionMeta<SearchOption>
    ) => {
        if (onSelect && value && actionMeta.action === "select-option") {
            onSelect({
                action: "select-option",
                suggestion: value
            });
        } else if (onClear && actionMeta.action === "clear") {
            onClear();
            // the next two lines are a workaround for the open bug in react-select regarding the
            // cursor not being shown after clearing although the component is focused:
            // https://github.com/JedWatson/react-select/issues/3871
            selectRef.current?.blur();
            selectRef.current?.focus();
        } else {
            LOG.debug("No event handler defined or unknown actiontype");
        }
    };

    // TODO: Fix typings?
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const selectRef = useRef<SelectInstance<any, any, any> | null>(null);

    return (
        <AsyncSelect<SearchOption, false, SearchGroupOption>
            ref={selectRef}
            isClearable={true}
            closeMenuOnSelect={closeMenuOnSelect}
            loadOptions={debouncedLoadOptions}
            components={{
                Option: HighlightOption,
                NoOptionsMessage: NoOptionsMessage,
                Menu: MenuComp,
                LoadingMessage: LoadingMessage,
                ValueContainer: ValueContainer
            }}
            chakraStyles={chakraStyles}
            onChange={onInputChange}
            className="search-async-select"
        />
    );
};

function useController(sources: DataSource[], map: MapModel | undefined) {
    const [controller, setController] = useState<SearchController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }
        const controller = new SearchController({ sources });
        setController(controller);
        return () => {
            setController(undefined);
        };
    }, [map, sources]);

    return controller;
}
