// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, chakra, FormControl } from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useCallback, useEffect, useState } from "react";
import { AsyncSelect, components, MenuProps, NoticeProps } from "chakra-react-select";
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
}

export const Search: FC<SearchProps> = (props) => {
    const { placeholder, closeMenuOnSelect, mapId, sources, searchTypingDelay } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const { map } = useMapModel(mapId);
    const controller = useController(sources, map);
    const loadOptions = async (inputValue: string): Promise<SearchGroupOption[]> => {
        const suggestions = await controller!.search(inputValue);
        return mapSuggestions(suggestions, sources);
    };

    const debouncedLoadOptions = useCallback(
        debounce(async (inputValue: string, callback: (options: unknown) => void) => {
            const results = await loadOptions(inputValue);
            callback(results);
        }, searchTypingDelay),
        [controller]
    );

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
    const noMessageText = intl.formatMessage({ id: "noOptionsText" });

    return (
        <components.NoOptionsMessage {...props}>
            <chakra.span className="search-no-match">{noMessageText}</chakra.span>
        </components.NoOptionsMessage>
    );
};

export const LoadingMessage = (props: NoticeProps<SearchGroupOption>) => {
    const intl = useIntl();
    const loadingText = intl.formatMessage({ id: "loadingText" });

    return (
        <components.LoadingMessage {...props}>
            <chakra.span className="search-loading-text">{loadingText}</chakra.span>
        </components.LoadingMessage>
    );
};
