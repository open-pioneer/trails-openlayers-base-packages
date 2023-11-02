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
        ]
    }
];

let filteredData: SearchGroupOption[] = [];

const filterData = (inputValue: string): SearchGroupOption[] => {
    // TODO: make filteredData restore
    filteredData = dummyData.map((searchGroupOption) => {
        searchGroupOption.options = searchGroupOption.options.filter((singleOption) =>
            singleOption.label.toLowerCase().includes(inputValue.toLowerCase())
        );
        return searchGroupOption;
    });
    return filteredData;
};

export const Search: FC<SearchProps> = (props) => {
    const { placeholder, closeMenuOnSelect } = props;
    const { containerProps } = useCommonComponentProps("search", props);

    const loadOptions = function (inputValue: string): Promise<SearchGroupOption[]> {
        return new Promise<SearchGroupOption[]>((resolve) => {
            setTimeout(() => {
                resolve(filterData(inputValue));
            }, 1000);
        });
    };

    return (
        <Box {...containerProps}>
            <FormControl alignItems="center">
                <AsyncSelect
                    name="colors"
                    placeholder={placeholder}
                    closeMenuOnSelect={closeMenuOnSelect}
                    loadOptions={loadOptions}
                />
            </FormControl>
        </Box>
    );
};
