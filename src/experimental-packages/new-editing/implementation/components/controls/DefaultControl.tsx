// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Checkbox,
    Input,
    Switch,
    Textarea,
    type CheckboxCheckedChangeDetails
} from "@chakra-ui/react";

import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import type { ChangeEvent, ReactNode } from "react";

import { ColorPickerControl } from "./ColorPickerControl";
import { ComboBoxControl } from "./ComboBoxControl";
import { NumberFieldControl } from "./NumberFieldControl";
import { RadioGroupControl } from "./RadioGroupControl";
import { SelectControl } from "./SelectControl";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { FieldConfig } from "../../../api/fields/FieldConfig";

export function DefaultControl({ field }: DefaultControlProps): ReactNode {
    const { properties } = usePropertyFormContext();

    const value = useReactiveSnapshot(
        () => properties.get(field.propertyName),
        [field.propertyName, properties]
    );

    const onInputChange = useEvent((event: ChangeEvent<InputElement>) => {
        if (event.target.value !== "") {
            if (field.type === "select") {
                properties.set(field.propertyName, parseFloat(event.target.value));
            } else {
                properties.set(field.propertyName, event.target.value);
            }
        } else {
            properties.set(field.propertyName, undefined);
        }
    });

    const onChange = useEvent((value: unknown) => {
        properties.set(field.propertyName, value);
    });

    const onCheckBoxChange = useEvent((details: CheckboxCheckedChangeDetails) => {
        properties.set(field.propertyName, details.checked === true);
    });

    switch (field.type) {
        case "check-box":
            return (
                <Checkbox.Root checked={!!value} onCheckedChange={onCheckBoxChange}>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{field.checkBoxLabel ?? field.label}</Checkbox.Label>
                </Checkbox.Root>
            );

        case "combo-box":
            return (
                <ComboBoxControl
                    value={value as string | number | undefined}
                    field={field}
                    onChange={onChange}
                />
            );

        case "custom":
            return field.render(value, onChange);

        case "color-picker":
            return (
                <ColorPickerControl
                    hexColor={value?.toString()}
                    field={field}
                    onChange={onChange}
                />
            );

        case "date-picker":
            return (
                <Input
                    type={field.includeTime ? "datetime-local" : "date"}
                    value={value?.toString() ?? ""}
                    onChange={onInputChange}
                />
            );

        case "number-field":
            return (
                <NumberFieldControl
                    value={value as number | undefined}
                    field={field}
                    onChange={onChange}
                />
            );

        case "radio-group":
            return (
                <RadioGroupControl
                    value={value as string | number | undefined}
                    field={field}
                    onChange={onChange}
                />
            );

        case "select":
            return (
                <SelectControl
                    value={value as string | number | undefined}
                    field={field}
                    onChange={onChange}
                />
            );

        case "switch":
            return (
                <Switch.Root checked={!!value} onCheckedChange={onCheckBoxChange}>
                    <Switch.HiddenInput />
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Label>{field.switchLabel ?? field.label}</Switch.Label>
                </Switch.Root>
            );

        case "text-area":
            return (
                <Textarea
                    placeholder={field.placeholder ?? field.label}
                    value={value?.toString()}
                    onChange={onInputChange}
                />
            );

        case "text-field":
            return (
                <Input
                    type="text"
                    placeholder={field.placeholder ?? field.label}
                    value={value?.toString() ?? ""}
                    onChange={onInputChange}
                />
            );
    }
}

export interface DefaultControlProps {
    readonly field: FieldConfig;
}

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
