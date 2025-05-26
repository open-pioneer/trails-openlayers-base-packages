// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FiSearch } from "react-icons/fi";
import { chakra, Icon, IconButton } from "@chakra-ui/react";
import { LuX } from "react-icons/lu";
import {
    ClearIndicatorProps,
    GroupProps,
    IndicatorsContainerProps,
    InputProps,
    MenuProps,
    NoticeProps,
    OptionProps,
    Props as SelectProps,
    SingleValueProps,
    ValueContainerProps,
    chakraComponents
} from "chakra-react-select";
import classNames from "classnames";
import { useIntl } from "open-pioneer:react-hooks";
import { UIEvent, useMemo } from "react";
import { SearchGroupOption, SearchOption } from "./Search";

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

export function GroupComp(props: GroupProps<SearchOption, false, SearchGroupOption>) {
    const ariaLabel = props.data.label;
    const innerProps = {
        ...props.innerProps,
        "aria-label": ariaLabel,
        role: "group"
    };
    return <chakraComponents.Group {...props} innerProps={innerProps}></chakraComponents.Group>;
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
            {!!children && (
                <Icon position="absolute" left="8px" boxSize="1.25em">
                    <FiSearch />
                </Icon>
            )}
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

export function IndicatorsContainer(
    props: IndicatorsContainerProps<SearchOption, false, SearchGroupOption>
) {
    return (
        <chakraComponents.IndicatorsContainer {...props}>
            {props.children}
            {!props.selectProps.isLoading && props.selectProps.inputValue && (
                <CustomClearIndicator
                    selectProps={props.selectProps}
                    clearValue={props.clearValue}
                />
            )}
        </chakraComponents.IndicatorsContainer>
    );
}

function CustomClearIndicator(props: {
    clearValue(): void;
    selectProps: SelectProps<SearchOption, false, SearchGroupOption>;
}) {
    const intl = useIntl();
    const clearButtonLabel = intl.formatMessage({
        id: "ariaLabel.clearButton"
    });
    const clickHandler = (e: UIEvent) => {
        e.preventDefault();
        e.stopPropagation();
        props.clearValue();
    };

    return (
        <IconButton
            size="sm"
            variant="ghost"
            mr="1px"
            aria-label={clearButtonLabel}
            onClick={clickHandler}
            // needed for correct touch handling; select control would otherwise preventDefault()
            onTouchEnd={clickHandler}
            // Stop select component from opening the menu.
            // It will otherwise flash briefly because of a mouse down listener in the select.
            onMouseDown={(e) => e.preventDefault()}
        >
            <Icon>
                <LuX />
            </Icon>
        </IconButton>
    );
}

export function ClearIndicator(
    _props: ClearIndicatorProps<SearchOption, false, SearchGroupOption>
) {
    // Never render anything; we use our own clear indicator
    return null;
}

export function HighlightOption(props: OptionProps<SearchOption, false, SearchGroupOption>) {
    const userInput = props.selectProps.inputValue;
    const label = props.data.label;
    const optionProps: typeof props = {
        ...props,
        className: classNames(props.className, "search-option")
    };

    const highlightedLabel = useMemo(() => {
        return (
            <chakra.div className="search-option-label">
                {userInput.trim().length > 0 ? getHighlightedLabel(label, userInput) : label}
            </chakra.div>
        );
    }, [label, userInput]);

    return <chakraComponents.Option {...optionProps}>{highlightedLabel}</chakraComponents.Option>;
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
