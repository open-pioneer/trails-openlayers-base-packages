// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, FormControl } from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC, useEffect, useState } from "react";
import { AsyncSelect } from "chakra-react-select";
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
    sources: DataSource[];
}

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

const filterData = async (inputValue: string): Promise<SearchGroupOption[]> => {
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
};

export const Search: FC<SearchProps> = (props) => {
    const { placeholder, closeMenuOnSelect, mapId, sources } = props;
    const { containerProps } = useCommonComponentProps("search", props);
    const { map } = useMapModel(mapId);
    const controller = useController(sources, map);
    const loadOptions = async (inputValue: string): Promise<SearchGroupOption[]> => {
        const suggestions = await controller!.search(inputValue);
        return mapSuggestions(suggestions, sources);
    };

    return (
        <Box {...containerProps}>
            <FormControl alignItems="center">
                <AsyncSelect
                    isClearable={true}
                    placeholder={placeholder}
                    closeMenuOnSelect={closeMenuOnSelect}
                    loadOptions={loadOptions}
                />
            </FormControl>
        </Box>
    );
};
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
