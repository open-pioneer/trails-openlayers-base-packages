// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    components,
    MenuProps,
    NoticeProps,
    OptionProps,
    ClearIndicatorProps,
    ValueContainerProps
} from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { chakra } from "@open-pioneer/chakra-integration";
import { KeyboardEvent } from "react";
import { SearchGroupOption, SearchOption } from "./Search";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";

export function MenuComp(props: MenuProps<SearchOption, false, SearchGroupOption>) {
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
}

export function NoOptionsMessage(props: NoticeProps<SearchOption, false, SearchGroupOption>) {
    const intl = useIntl();
    const noMessageText = intl.formatMessage({ id: "noOptionsText" });

    return (
        <components.NoOptionsMessage {...props}>
            <chakra.span className="search-no-match">{noMessageText}</chakra.span>
        </components.NoOptionsMessage>
    );
}

export function LoadingMessage(props: NoticeProps<SearchOption, false, SearchGroupOption>) {
    const intl = useIntl();
    const loadingText = intl.formatMessage({ id: "loadingText" });

    return (
        <components.LoadingMessage {...props}>
            <chakra.span className="search-loading-text">{loadingText}</chakra.span>
        </components.LoadingMessage>
    );
}

export function ValueContainer({
    children,
    ...props
}: ValueContainerProps<SearchOption, false, SearchGroupOption>) {
    return (
        components.ValueContainer && (
            <components.ValueContainer {...props} className="search-value-container">
                {!!children && <SearchIcon style={{ position: "absolute", left: 8 }}></SearchIcon>}
                {children}
            </components.ValueContainer>
        )
    );
}

export function ClearIndicator({
    children: _ignored,
    ...props
}: ClearIndicatorProps<SearchOption, false, SearchGroupOption>) {
    const keyHandler = (e: KeyboardEvent) => {
        if (e.key !== "Enter") {
            return;
        }

        e.preventDefault();
        props.clearValue();
    };

    return (
        components.ClearIndicator && (
            <components.ClearIndicator {...props} className="search-clear-container">
                <CloseIcon role="button" tabIndex={0} onKeyDown={keyHandler}></CloseIcon>
            </components.ClearIndicator>
        )
    );
}

export function HighlightOption(props: OptionProps<SearchOption, false, SearchGroupOption>) {
    const userInput = props.selectProps.inputValue;
    const label = props.data.label;
    return (
        <components.Option {...props} className="search-option">
            <chakra.div>
                {userInput.trim().length > 0 ? getHighlightedLabel(label, userInput) : label}
            </chakra.div>
        </components.Option>
    );
}

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
