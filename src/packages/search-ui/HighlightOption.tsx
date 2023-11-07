// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { components, OptionProps } from "chakra-react-select";
import { SearchGroupOption } from "./Search";

function getHighlightedLabel(label: string, userInput: string) {
    const matchIndex = label.toLowerCase().indexOf(userInput.toLowerCase());
    if (matchIndex >= 0) {
        return (
            <span>
                {label.substring(0, matchIndex)}
                <span key="highlighted" className="search-highlightedMatch">
                    {label.substring(matchIndex, matchIndex + userInput.length)}
                </span>
                {label.substring(matchIndex + userInput.length)}
            </span>
        );
    }
    return label;
}

export const HighlightOption = (props: OptionProps<SearchGroupOption>) => {
    const userInput = props.selectProps.inputValue;
    const label = props.data.label;
    return (
        <components.Option {...props}>
            <div>{userInput.trim().length ? getHighlightedLabel(label, userInput) : label}</div>
        </components.Option>
    );
};
