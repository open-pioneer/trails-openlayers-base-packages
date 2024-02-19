// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Checkbox, Tooltip, chakra } from "@open-pioneer/chakra-integration";
import { ChangeEvent } from "react";

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
            className={className}
            isChecked={isChecked}
            onChange={onChange}
            isIndeterminate={isIndeterminate}
            isDisabled={isDisabled}
        />
    );
    return toolTipLabel ? (
        <Tooltip label={toolTipLabel} placement="right" closeOnClick={false}>
            <chakra.span
            /* 
               wrap into span to fix tooltip around checkbox, see https://github.com/chakra-ui/chakra-ui/issues/6353
               not using "shouldWrapChildren" because that also introduces a _focusable_ span (we only want the checkbox)
            */
            >
                {checkboxComponent}
            </chakra.span>
        </Tooltip>
    ) : (
        checkboxComponent
    );
}
