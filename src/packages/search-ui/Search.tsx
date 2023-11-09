// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, chakra, FormControl } from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useCallback, useEffect, useState } from "react";
import { ActionMeta, AsyncSelect, components, MenuProps, NoticeProps } from "chakra-react-select";
import { DataSource, Suggestion } from "./api";
import { SearchController } from "./SearchController";
import { HighlightOption } from "./HighlightOption";
import { useIntl } from "open-pioneer:react-hooks";

export interface SearchOption {
    value: string;
    label: string;
}
export interface SearchGroupOption {
    label: string;
    options: SearchOption[];
    priority?: number;
}

export interface SearchEvent {
    action: string;
    value?: SearchOption;
}

/**
 * This is for special properties of the Search component
 */
export interface SearchProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
    sources: DataSource[];
    name?: string;
    placeholder?: string;
    closeMenuOnSelect?: boolean;
    searchTypingDelay?: number;
    showDropdownIndicator?: boolean;
    onSelect(event: SearchEvent): void;
    onClear(event: SearchEvent): void;
}

export const Search: FC<SearchProps> = (props) => {
    const {
        placeholder,
        closeMenuOnSelect,
        mapId,
        sources,
        searchTypingDelay,
        showDropdownIndicator,
        onSelect,
        onClear
    } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const { map } = useMapModel(mapId);
    const controller = useController(sources, map);
    const loadOptions = async (inputValue: string): Promise<SearchGroupOption[]> => {
        const suggestions = await controller!.search(inputValue);
        return mapSuggestions(suggestions, sources);
    };

    const debouncedLoadOptions = useCallback(
        debounce(async (inputValue: string, callback: (options: unknown) => void) => {
            try {
                const results = await loadOptions(inputValue);
                callback(results); // <-- Notice we added here the "await" keyword.
            } catch (e) {
                if (e instanceof Error) {
                    if (e.name == "AbortError") {
                        console.debug("Previous searchquery has been canceled by the user.");
                    } else {
                        console.error(e.message);
                    }
                } else {
                    console.error(e);
                }
            }
        }, searchTypingDelay),
        [controller]
    );

    const displayCss = showDropdownIndicator ? "inherit" : "none";
    const chakraStyles = {
        dropdownIndicator: (provided: object) => ({
            ...provided,
            display: displayCss
        })
    };

    //Typescript doesn't recognize Type SearchOption but rather SingleValue<SearchGroupOption>
    const onInputChange = (value: unknown, actionMeta: ActionMeta<unknown>) => {
        if (value && actionMeta.action === "select-option") {
            onSelect({ action: "select", value: value as SearchOption });
        } else if (actionMeta.action === "clear") {
            onClear({
                action: "select",
                value: actionMeta.removedValues as unknown as SearchOption
            });
        } else {
            console.debug("unknown Actiontype");
        }
    };

    return (
        <Box {...containerProps}>
            <FormControl alignItems="center">
                <AsyncSelect
                    isClearable={true}
                    placeholder={placeholder}
                    closeMenuOnSelect={closeMenuOnSelect}
                    loadOptions={debouncedLoadOptions}
                    components={{
                        Option: HighlightOption,
                        NoOptionsMessage: NoOptionsMessage,
                        Menu: MenuComp,
                        LoadingMessage: LoadingMessage
                    }}
                    chakraStyles={chakraStyles}
                    onChange={onInputChange}
                />
            </FormControl>
        </Box>
    );
};

// TODO: This should accept all functions as an utility function, but this is banned by eslint.
// TODO: It would be better when the delay would not trigger the loading animation
// eslint-disable-next-line @typescript-eslint/ban-types
function debounce<T extends Function>(delayedFunction: T, delay = 250) {
    let timeout: NodeJS.Timeout | string | number | undefined;

    return (...args: unknown[]) => {
        timeout && clearTimeout(timeout);
        timeout = setTimeout(() => {
            delayedFunction(...args);
        }, delay);
    };
}

function mapSuggestions(suggestions: Suggestion[][], sources: DataSource[]) {
    const options = sources.map((source, index) => ({
        label: source.label,
        options: suggestions[index]?.map((item) => ({ value: item.text, label: item.text })) || []
    }));
    return options;
}
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

export const MenuComp = (props: MenuProps<SearchGroupOption>) => {
    const hasInput = props.selectProps.inputValue.length > 0;
    let clazz = "";
    if (!hasInput) {
        clazz = "search-invisible";
    }
    return (
        <components.Menu {...props} className={clazz}>
            {props.children}
        </components.Menu>
    );
};

export const NoOptionsMessage = (props: NoticeProps<SearchGroupOption>) => {
    const intl = useIntl();
    // TODO: Make it configurable?
    const noMessageText = intl.formatMessage({ id: "noOptionsText" });

    return (
        <components.NoOptionsMessage {...props}>
            <chakra.span className="search-no-match">{noMessageText}</chakra.span>
        </components.NoOptionsMessage>
    );
};

export const LoadingMessage = (props: NoticeProps<SearchGroupOption>) => {
    const intl = useIntl();
    // TODO: Make it configurable?
    const loadingText = intl.formatMessage({ id: "loadingText" });

    return (
        <components.LoadingMessage {...props}>
            <chakra.span className="search-loading-text">{loadingText}</chakra.span>
        </components.LoadingMessage>
    );
};
