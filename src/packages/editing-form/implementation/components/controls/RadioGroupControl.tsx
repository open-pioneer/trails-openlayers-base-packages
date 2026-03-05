// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { RadioGroup, VStack } from "@chakra-ui/react";

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
        <RadioGroup.Root value={selectedValue} orientation="vertical" onValueChange={onValueChange}>
            <VStack align="start" gap={2}>
                {field.options.map((option) => (
                    <RadioGroup.Item key={option.value} value={option.value.toString()}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                ))}
            </VStack>
        </RadioGroup.Root>
    );
}
