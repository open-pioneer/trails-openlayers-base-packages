// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra, Checkbox } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@open-pioneer/chakra-snippets/radio";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { memo, ReactNode, useId } from "react";

export interface SelectComponentProps {
    mode?: "checkbox" | "radio";
    toolTipLabel?: string;

    className?: string;
    ariaLabel?: string;
    checked: boolean | "indeterminate";
    disabled?: boolean;
    onChange?: (newIsChecked: boolean) => void;
}

export function createSelectComponent(props: SelectComponentProps): ReactNode {
    const { mode = "checkbox", toolTipLabel, ariaLabel = props.toolTipLabel, ...rest } = props;

    let control: ReactNode;
    switch (mode) {
        case "checkbox": {
            control = <SelectCheckbox ariaLabel={ariaLabel} {...rest} />;
            break;
        }
        case "radio": {
            control = <SelectRadio ariaLabel={ariaLabel} {...rest} />;
            break;
        }
    }

    if (toolTipLabel) {
        /*
            wrap tooltip content into span to fix tooltip around checkbox, see https://github.com/chakra-ui/chakra-ui/issues/6353
        */
        control = (
            <Tooltip
                content={toolTipLabel}
                positioning={{ placement: "right" }}
                closeOnClick={false}
            >
                <chakra.span>{control}</chakra.span>
            </Tooltip>
        );
    }
    return control;
}

type SelectComponentInnerProps = Omit<SelectComponentProps, "mode" | "toolTipLabel">;

const SelectCheckbox = memo(function SelectCheckbox({
    className,
    ariaLabel,
    checked,
    disabled,
    onChange
}: SelectComponentInnerProps) {
    const checkboxId = useId();
    return (
        <Checkbox.Root
            //fix invalid aria-labeledby, this works because we never actually render the label
            ids={{ root: checkboxId, label: checkboxId }}
            className={className}
            aria-label={ariaLabel}
            checked={checked}
            disabled={disabled}
            onCheckedChange={(e) => {
                onChange?.(!!e.checked); // "indeterminate" not required -> map to true
            }}
        >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
                <Checkbox.Indicator />
            </Checkbox.Control>
        </Checkbox.Root>
    );
});

const SelectRadio = memo(function SelectRadio({
    className,
    ariaLabel,
    checked: checkedProp,
    disabled,
    onChange
}: SelectComponentInnerProps) {
    const id = useId();
    const checked = !!checkedProp; // indeterminate not supported, default to "true"

    /** Name seems to be required for screen reader tabbing support. */
    return (
        <RadioGroup
            name={id}
            value={checked ? id : null}
            onValueChange={(e) => {
                onChange?.(e.value === id);
            }}
        >
            <Radio className={className} value={id} disabled={disabled} aria-label={ariaLabel} />
        </RadioGroup>
    );
});
