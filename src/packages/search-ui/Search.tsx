// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, FormControl } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { FC } from "react";
import { AsyncSelect } from "chakra-react-select";

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
 * Option-Object for Configuration
 */
export interface SortOption {
    usePriority: boolean;
    sortingOrder: string;
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
    sortOption?: SortOption;
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

/**
 * Methode for sorting SearchGroupOption after priority
 * @param a
 * @param b
 * @returns
 */
const sortPriority = (a: SearchGroupOption, b: SearchGroupOption) => {
    if (!a.priority && !b.priority) return 0;
    if (!a.priority) {
        return -1;
    } else if (!b.priority) {
        return 1;
    } else {
        return a.priority - b.priority;
    }
};

/**
 *
 * @param a Methode for sorting SearchOption values
 * @param b
 * @returns
 */
// eslint-disable-next-line
const sortValues = (a: SearchOption, b: SearchOption) => {
    const valueA = a.value.toUpperCase(); // ignore upper and lowercase
    const valueB = b.value.toUpperCase(); // ignore upper and lowercase
    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
};

// TODO: Replace Any with correct type
/**
 * Async-Wrapper for array.sort()-function
 * @param array
 * @param sortFunction
 * @returns
 */
// eslint-disable-next-line
const sortArrayAsynchron = async (array: any[], sortFunction: (a: any, b: any) => number) => {
    return array.sort(sortFunction);
};

/**
 * Methode for sorting the order of SearchGroupOption and the order of SearchGroupOption.options
 * @param data
 * @param sortOption
 * @returns
 */
const sortData = async (data: SearchGroupOption[], sortOption?: SortOption) => {
    if (sortOption?.usePriority) data = await sortArrayAsynchron(data, sortPriority);
    //Todo: Asnyc sort foreach SearchOption
    return data;
};

export const Search: FC<SearchProps> = (props) => {
    const { placeholder, closeMenuOnSelect, sortOption } = props;
    const { containerProps } = useCommonComponentProps("search", props);

    const loadOptions = function (inputValue: string): Promise<SearchGroupOption[]> {
        return new Promise<SearchGroupOption[]>((resolve) => {
            setTimeout(async () => {
                //first get the Searchresults
                const filterResult = await filterData(inputValue);
                //Second order the results
                const sortResult = await sortData(filterResult, sortOption);
                resolve(sortResult);
            }, 1000);
        });
    };

    return (
        <Box {...containerProps}>
            <FormControl alignItems="center">
                <AsyncSelect
                    isClearable={true}
                    name="colors"
                    placeholder={placeholder}
                    closeMenuOnSelect={closeMenuOnSelect}
                    loadOptions={loadOptions}
                />
            </FormControl>
        </Box>
    );
};
