// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    chakraComponents,
    MenuProps,
    NoticeProps,
    OptionProps,
    ClearIndicatorProps,
    ValueContainerProps,
    InputProps,
    SingleValueProps
} from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { chakra } from "@open-pioneer/chakra-integration";
import { KeyboardEvent } from "react";
import classNames from "classnames";
import { SearchGroupOption, SearchOption } from "./Search";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";

export function MenuComp(props: MenuProps<SearchOption, false, SearchGroupOption>) {
    const hasInput = props.selectProps.inputValue.length > 0;
    const menuProps: typeof props = {
        ...props,
        className: classNames(props.className, {
            "search-invisible": !hasInput
        })
    };

    return <chakraComponents.Menu {...menuProps}>{props.children}</chakraComponents.Menu>;
}

export function NoOptionsMessage(props: NoticeProps<SearchOption, false, SearchGroupOption>) {
    const intl = useIntl();
    const noMessageText = intl.formatMessage({ id: "noOptionsText" });

    return (
        <chakraComponents.NoOptionsMessage {...props}>
            <chakra.span className="search-no-match">{noMessageText}</chakra.span>
        </chakraComponents.NoOptionsMessage>
    );
}

export function LoadingMessage(props: NoticeProps<SearchOption, false, SearchGroupOption>) {
    const intl = useIntl();
    const loadingText = intl.formatMessage({ id: "loadingText" });

    return (
        <chakraComponents.LoadingMessage {...props}>
            <chakra.span className="search-loading-text">{loadingText}</chakra.span>
        </chakraComponents.LoadingMessage>
    );
}

export function ValueContainer({
    children,
    ...props
}: ValueContainerProps<SearchOption, false, SearchGroupOption>) {
    const containerProps: typeof props = {
        ...props,
        className: classNames(props.className, "search-value-container")
    };
    return (
        <chakraComponents.ValueContainer {...containerProps}>
            {!!children && <SearchIcon style={{ position: "absolute", left: 8 }}></SearchIcon>}
            {children}
        </chakraComponents.ValueContainer>
    );
}

export function Input(props: InputProps<SearchOption, false, SearchGroupOption>) {
    const inputProps: typeof props = {
        ...props,
        isHidden: false
    };
    return <chakraComponents.Input {...inputProps} />;
}

export function SingleValue(_props: SingleValueProps<SearchOption, false, SearchGroupOption>) {
    // Never render anything (we use the text input to show the selected result)
    return null;
}

export function ClearIndicator({
    children: _ignored,
    ...props
}: ClearIndicatorProps<SearchOption, false, SearchGroupOption>) {
    const intl = useIntl();
    const clearButtonLabel = intl.formatMessage({
        id: "ariaLabel.clearButton"
    });
    const keyHandler = (e: KeyboardEvent) => {
        if (e.key !== "Enter") {
            return;
        }

        e.preventDefault();
        props.clearValue();
    };
    const indicatorProps: typeof props = {
        ...props,
        className: classNames(props.className, "search-clear-container"),
        innerProps: {
            ...props.innerProps,
            "aria-hidden": false
        }
    };

    return (
        <chakraComponents.ClearIndicator {...indicatorProps}>
            <CloseIcon
                role="button"
                tabIndex={0}
                onKeyDown={keyHandler}
                aria-label={clearButtonLabel}
            />
        </chakraComponents.ClearIndicator>
    );
}

export function HighlightOption(props: OptionProps<SearchOption, false, SearchGroupOption>) {
    const userInput = props.selectProps.inputValue;
    const label = props.data.label;
    const optionProps: typeof props = {
        ...props,
        className: classNames(props.className, "search-option")
    };
    return (
        <chakraComponents.Option {...optionProps}>
            <chakra.div className="search-option-label">
                {userInput.trim().length > 0 ? getHighlightedLabel(label, userInput) : label}
            </chakra.div>
        </chakraComponents.Option>
    );
}

function getHighlightedLabel(label: string, userInput: string) {
    const matchIndex = label.toLowerCase().indexOf(userInput.toLowerCase());
    if (matchIndex >= 0) {
        return (
            <>
                {label.substring(0, matchIndex)}
                <chakra.span key="highlighted" className="search-highlighted-match">
                    {label.substring(matchIndex, matchIndex + userInput.length)}
                </chakra.span>
                {label.substring(matchIndex + userInput.length)}
            </>
        );
    }
    return label;
}
