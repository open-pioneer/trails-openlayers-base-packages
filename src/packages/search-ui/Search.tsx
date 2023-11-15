// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { isAbortError, createLogger } from "@open-pioneer/core";

import { Box, FormControl } from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useState } from "react";
import { AsyncSelect } from "chakra-react-select";
import { DataSource, SuggestionGroup } from "./api";
import { SearchController } from "./SearchController";
import { HighlightOption } from "./HighlightOption";

const LOG = createLogger("search-ui.Search");
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

    name?: string;
    placeholder?: string;
    closeMenuOnSelect?: boolean;
    sources: DataSource[];
    searchTypingDelay?: number;
}

export const Search: FC<SearchProps> = (props) => {
    const { placeholder, closeMenuOnSelect, mapId, sources, searchTypingDelay = 250 } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const { map } = useMapModel(mapId);
    const controller = useController(sources, searchTypingDelay, map);

    const loadOptions = async (inputValue: string) => {
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

    return (
        <Box {...containerProps}>
            <FormControl alignItems="center">
                <AsyncSelect
                    isClearable={true}
                    placeholder={placeholder}
                    closeMenuOnSelect={closeMenuOnSelect}
                    loadOptions={loadOptions}
                    components={{ Option: HighlightOption }}
                />
            </FormControl>
        </Box>
    );
};
function mapSuggestions(suggestions: SuggestionGroup[]) {
    const options = suggestions.map((group) => ({
        label: group.label,
        options: group.suggestions.map((suggestion) => ({
            value: suggestion.id.toString(),
            label: suggestion.text
        }))
    }));
    return options;
}
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
            setController(undefined);
        };
    }, [map, sources, searchTypingDelay]);

    return controller;
}
