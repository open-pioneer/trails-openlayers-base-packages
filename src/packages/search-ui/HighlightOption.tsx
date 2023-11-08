// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { components, OptionProps } from "chakra-react-select";
import { SearchGroupOption } from "./Search";
import { chakra } from "@open-pioneer/chakra-integration";

function getHighlightedLabel(label: string, userInput: string) {
    const matchIndex = label.toLowerCase().indexOf(userInput.toLowerCase());
    if (matchIndex >= 0) {
        return (
            <chakra.span>
                {label.substring(0, matchIndex)}
                <chakra.span key="highlighted" className="search-highlighted-match">
                    {label.substring(matchIndex, matchIndex + userInput.length)}
                </chakra.span>
                {label.substring(matchIndex + userInput.length)}
            </chakra.span>
        );
    }
    return label;
}

export const HighlightOption = (props: OptionProps<SearchGroupOption>) => {
    const userInput = props.selectProps.inputValue;
    const label = props.data.label;
    return (
        <components.Option {...props}>
            <chakra.div>
                {userInput.trim().length > 0 ? getHighlightedLabel(label, userInput) : label}
            </chakra.div>
        </components.Option>
    );
};
