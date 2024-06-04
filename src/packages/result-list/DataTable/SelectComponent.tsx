// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Checkbox, Radio, Tooltip, chakra } from "@open-pioneer/chakra-integration";
import { ChangeEvent, useId, useMemo } from "react";

export interface SelectComponentProps {
    mode?: "checkbox" | "radio";
    toolTipLabel?: string;

    className?: string;
    "aria-label"?: string;
    isIndeterminate?: boolean;
    isChecked?: boolean;
    isDisabled?: boolean;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function SelectComponent({
    mode = "checkbox",
    toolTipLabel,
    ...props
}: SelectComponentProps) {
    const Component = mode === "checkbox" ? Checkbox : SelectRadio;
    const renderedComponent = useMemo(() => {
        return <Component {...props} />;
    }, [Component, props]);
    if (!toolTipLabel) {
        return renderedComponent;
    }

    return (
        <Tooltip label={toolTipLabel} placement="right" closeOnClick={false}>
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
    const { isIndeterminate, ...rest } = props;
    void isIndeterminate; // ignored, not supported by radio button

    /** Name seems to be required for screen reader tabbing support. */
    return <Radio name={id} {...rest} />;
}
