// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Select, Portal } from "@chakra-ui/react";

import type { ReactElement } from "react";
import type { SelectConfig } from "../../../api/fields/optionFieldConfigs";
import { useOptionProps, type OptionControlProps } from "./useOptionProps";

export function SelectControl(props: OptionControlProps<SelectConfig>): ReactElement {
    const { selectedValue, collection, placeholder, showClearTrigger, onValueChange } =
        useOptionProps(props);

    return (
        <Select.Root value={selectedValue} collection={collection} onValueChange={onValueChange}>
            <Select.HiddenSelect />
            <Select.Control>
                <Select.Trigger>
                    <Select.ValueText placeholder={placeholder} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                    {showClearTrigger && <Select.ClearTrigger />}
                    <Select.Indicator />
                </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
                <Select.Positioner>
                    <Select.Content>
                        {collection.items.map((option) => (
                            <Select.Item key={option.value} item={option.value}>
                                {option.label}
                                <Select.ItemIndicator />
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    );
}
