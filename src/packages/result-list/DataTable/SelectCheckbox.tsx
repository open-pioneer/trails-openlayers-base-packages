// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Checkbox, Tooltip } from "@open-pioneer/chakra-integration";
import { ChangeEvent, useRef } from "react";

export interface SelectCheckboxProps {
    className?: string;
    ariaLabel?: string;
    toolTipLabel?: string;
    isIndeterminate?: boolean;
    isChecked?: boolean;
    isDisabled?: boolean;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function SelectCheckbox({
    isIndeterminate,
    className,
    toolTipLabel,
    ariaLabel,
    isChecked,
    onChange,
    isDisabled
}: SelectCheckboxProps) {
    const checkboxComponent = (
        <Checkbox
            aria-label={ariaLabel}
            tabIndex={0}
            className={className}
            isChecked={isChecked}
            onChange={onChange}
            isIndeterminate={isIndeterminate}
            isDisabled={isDisabled}
        />
    );
    return toolTipLabel ? (
        <Tooltip label={toolTipLabel} placement="right" shouldWrapChildren closeOnClick={false}>
            {checkboxComponent}
        </Tooltip>
    ) : (
        checkboxComponent
    );
}
