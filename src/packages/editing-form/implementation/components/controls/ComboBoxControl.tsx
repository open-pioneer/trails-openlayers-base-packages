// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Combobox, Portal } from "@chakra-ui/react";

import type { ReactElement } from "react";
import type { ComboBoxConfig } from "../../../api/fields/optionFieldConfigs";
import { useOptionProps, type OptionControlProps } from "./useOptionProps";

export function ComboBoxControl(props: OptionControlProps<ComboBoxConfig>): ReactElement {
    const {
        selectedValue,
        collection,
        placeholder,
        showClearTrigger,
        onInputValueChange,
        onValueChange
    } = useOptionProps(props);

    return (
        <Combobox.Root
            value={selectedValue}
            collection={collection}
            onInputValueChange={onInputValueChange}
            onValueChange={onValueChange}
        >
            <Combobox.Control>
                <Combobox.Input placeholder={placeholder} />
                <Combobox.IndicatorGroup>
                    {showClearTrigger && <Combobox.ClearTrigger />}
                    <Combobox.Trigger />
                </Combobox.IndicatorGroup>
            </Combobox.Control>
            <Portal>
                <Combobox.Positioner>
                    <Combobox.Content>
                        {collection.items.map((option) => (
                            <Combobox.Item key={option.value} item={option}>
                                {option.label}
                                <Combobox.ItemIndicator />
                            </Combobox.Item>
                        ))}
                    </Combobox.Content>
                </Combobox.Positioner>
            </Portal>
        </Combobox.Root>
    );
}
