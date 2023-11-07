// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, FormControl } from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useState, useCallback } from "react";
import { AsyncSelect } from "chakra-react-select";
import { HighlightOption } from "./HighlightOption";
import { DataSource, Suggestion } from "./api";
import { SearchController } from "./SearchController";

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
    searchTypingDelay?: number;
    sources: DataSource[];
}

export const Search: FC<SearchProps> = (props) => {
    const { placeholder, closeMenuOnSelect, searchTypingDelay } = props;
    const { containerProps } = useCommonComponentProps("search", props);

    const loadOptions = function (inputValue: string, callback: (options: unknown) => void): void {
        setTimeout(async () => {
            // TODO: Move Data- and Sort-Logic to Controller
            //first get the Searchresults
            const filterResult = await filterData(inputValue);
            callback(filterResult);
        }, 250);
    };

    const debouncedLoadOptions = useCallback(
        debounce((inputValue: string, callback: (options: unknown) => void) => {
            loadOptions(inputValue, callback);
        }, searchTypingDelay),
        []
    );

    return (
        <Box {...containerProps}>
            <FormControl alignItems="center">
                <AsyncSelect
                    isClearable={true}
                    name="colors"
                    placeholder={placeholder}
                    closeMenuOnSelect={closeMenuOnSelect}
                    loadOptions={debouncedLoadOptions}
                    components={{ Option: HighlightOption }}
                />
            </FormControl>
        </Box>
    );
};

const dummyData: SearchGroupOption[] = [
    {
        label: "Straßen",
        options: [
            {
                value: "brückenweg",
                label: "Brückenweg"
            },
            {
                value: "vogelgasse",
                label: "Vogelgasse"
            }
        ],
        priority: 2
    },
    {
        label: "Location",
        options: [
            {
                value: "hamburg",
                label: "Hamburg"
            },
            {
                value: "münster",
                label: "Münster"
            },
            {
                value: "bamberg",
                label: "Bamberg"
            }
        ],
        priority: 1
    }
];

let filteredData: SearchGroupOption[] = [];

async function filterData(inputValue: string): Promise<SearchGroupOption[]> {
    // copy dummyData (not deep copy!)
    filteredData = dummyData
        .map((searchTheme) => Object.assign({}, searchTheme))
        .filter((searchGroupOption) => {
            searchGroupOption.options = searchGroupOption.options.filter((singleOption) =>
                singleOption.label.toLowerCase().includes(inputValue.toLowerCase())
            );
            return searchGroupOption;
        });
    return filteredData;
}
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
