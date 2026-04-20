// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { VStack } from "@chakra-ui/react";
import { Radio, RadioGroup } from "@open-pioneer/chakra-snippets/radio";
import type { ReactElement } from "react";
import type { RadioGroupConfig } from "../../../api/fields/optionFieldConfigs";
import { useOnValueChange, type OptionControlProps } from "./useOptionProps";

export function RadioGroupControl({
    value,
    field,
    onChange
}: OptionControlProps<RadioGroupConfig>): ReactElement {
    const selectedValue = value?.toString();
    const onValueChange = useOnValueChange(field.valueType, onChange);

    return (
        <RadioGroup
            value={selectedValue}
            orientation="vertical"
            onValueChange={onValueChange}
            ml={"3px"}
        >
            <VStack align="start" gap={2}>
                {field.options.map((option) => (
                    <Radio key={option.value} value={option.value.toString()}>
                        {option.label}
                    </Radio>
                ))}
            </VStack>
        </RadioGroup>
    );
}
