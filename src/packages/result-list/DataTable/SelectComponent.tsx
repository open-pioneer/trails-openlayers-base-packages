// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { chakra } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { Checkbox } from "@open-pioneer/chakra-snippets/checkbox";
import { Radio, RadioGroup } from "@open-pioneer/chakra-snippets/radio";
import { useId, useMemo, useState } from "react";

export interface SelectComponentProps {
    mode?: "checkbox" | "radio";
    toolTipLabel?: string;

    className?: string;
    "aria-label"?: string;
    indeterminate?: boolean;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (newIsChecked: boolean) => void;
}

export function SelectComponent({
    mode = "checkbox",
    toolTipLabel,
    onChange,
    ...props
}: SelectComponentProps) {
    const renderedComponent = useMemo(() => {
        switch (mode) {
            case "checkbox": {
                const checked = props.indeterminate ? "indeterminate" : !!props.checked;
                return (
                    <Checkbox
                        onCheckedChange={(e) => {
                            onChange?.(!!e.checked);
                        }}
                        {...props}
                        checked={checked}
                    />
                );
            }
            case "radio":
                return <SelectRadio {...props} />;
            default:
                throw new Error(`Unsupported mode: ${mode}`);
        }
    }, [mode, props, onChange]);

    if (!toolTipLabel) {
        return renderedComponent;
    }

    return (
        <Tooltip content={toolTipLabel} positioning={{ placement: "right" }} closeOnClick={false}>
            <chakra.span
            /* 
                wrap into span to fix tooltip around checkbox, see https://github.com/chakra-ui/chakra-ui/issues/6353
                not using "shouldWrapChildren" because that also introduces a _focusable_ span (we only want the checkbox)
            */
            >
                {renderedComponent}
            </chakra.span>
        </Tooltip>
    );
}

function SelectRadio(props: Omit<SelectComponentProps, "mode">) {
    const id = useId();
    const { indeterminate, onChange, ...rest } = props;
    void indeterminate; // ignored, not supported by radio button
    const checked = props.checked;
    const [value, setValue] = useState<string | null>(checked ? id : null);

    /** Value seems to be required for screen reader tabbing support. */
    return (
        <RadioGroup
            value={value}
            onValueChange={(e) => {
                setValue(e.value === id ? id : null);
                onChange?.(e.value === id);
            }}
        >
            <Radio value={id} {...rest} />
        </RadioGroup>
    );
}
