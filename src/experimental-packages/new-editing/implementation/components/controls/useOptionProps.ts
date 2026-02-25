// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    useListCollection,
    useFilter,
    type ComboboxInputValueChangeDetails,
    type ComboboxValueChangeDetails,
    type SelectValueChangeDetails,
    type RadioGroupValueChangeDetails
} from "@chakra-ui/react";

import { useEvent } from "@open-pioneer/react-utils";
import { useMemo } from "react";
import type { SelectConfig, ComboBoxConfig } from "../../../api/fields/optionFieldConfigs";

export function useOptionProps({ value, field, onChange }: OptionControlProps) {
    const selectedValue = useMemo(() => (value != undefined ? [value.toString()] : []), [value]);
    const { collection, onInputValueChange } = useCollection(field);
    const onValueChange = useOnValueChange(field.valueType, onChange);

    return {
        selectedValue,
        collection,
        placeholder: field.placeholder ?? field.label,
        showClearTrigger: field.showClearTrigger ?? !(field.isRequired ?? false),
        onInputValueChange,
        onValueChange
    };
}

export function useOnValueChange(
    valueType: "string" | "number",
    onChange: (value: unknown) => void
) {
    return useEvent((details: ValueChangeDetails) => {
        const newValue = details.value?.[0];
        if (valueType === "number") {
            onChange(newValue !== undefined ? parseFloat(newValue) : undefined);
        } else {
            onChange(newValue);
        }
    });
}

function useCollection(field: SelectConfig | ComboBoxConfig) {
    const initialItems = useMemo(() => {
        return field.options.map(({ label, value }) => ({ label, value: value.toString() }));
    }, [field.options]);

    const { contains } = useFilter({ sensitivity: "base" });
    const { collection, filter } = useListCollection({ initialItems, filter: contains });

    const onInputValueChange = useEvent((details: ComboboxInputValueChangeDetails) => {
        filter(details.inputValue);
    });

    return { collection, onInputValueChange };
}

export interface OptionControlProps<T = SelectConfig | ComboBoxConfig> {
    readonly value: string | number | undefined;
    readonly field: T;
    readonly onChange: (value: unknown) => void;
}

type ValueChangeDetails =
    | SelectValueChangeDetails
    | ComboboxValueChangeDetails
    | RadioGroupValueChangeDetails;
