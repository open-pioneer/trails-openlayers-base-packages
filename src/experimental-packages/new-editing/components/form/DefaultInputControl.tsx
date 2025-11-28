// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Checkbox,
    Field,
    Input,
    NativeSelectRoot,
    NativeSelectField,
    Textarea,
    NativeSelectIndicator
} from "@chakra-ui/react";

import { ChangeEvent, useCallback, type ReactElement } from "react";

import { NumericInput } from "./NumericInput";
import { ColorPickerInput } from "./ColorPickerInput";
import { useProperty, usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { FieldInput } from "../../model/FeatureTemplate";

export function DefaultInputControl({ fieldInput }: DefaultInputControlProps): ReactElement {
    const { setProperty } = usePropertyFormContext();
    const { fieldName } = fieldInput;
    const value = useProperty(fieldName);

    const onInputChange = useCallback(
        (event: ChangeEvent<InputElement>) => {
            if (event.target.value !== "") {
                if (fieldInput.inputType === "select" && fieldInput.valueType === "number") {
                    setProperty(fieldName, parseFloat(event.target.value));
                } else {
                    setProperty(fieldName, event.target.value);
                }
            } else {
                setProperty(fieldName, undefined);
            }
        },
        [fieldInput, fieldName, setProperty]
    );

    const onChange = useCallback(
        (value: unknown) => {
            setProperty(fieldName, value);
        },
        [fieldName, setProperty]
    );

    const onCheckBoxChange = useCallback(
        (details: { checked: boolean | string }) => {
            setProperty(fieldName, details.checked === true || details.checked === "true");
        },
        [fieldName, setProperty]
    );

    switch (fieldInput.inputType) {
        case "text-field":
            return (
                <Field.Root required={fieldInput.required}>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                        type="text"
                        placeholder={fieldInput.placeholder ?? fieldInput.label}
                        value={value?.toString() ?? ""}
                        onChange={onInputChange}
                    />
                </Field.Root>
            );

        case "text-area":
            return (
                <Field.Root required={fieldInput.required}>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <Textarea
                        placeholder={fieldInput.placeholder ?? fieldInput.label}
                        value={value?.toString()}
                        onChange={onInputChange}
                    />
                </Field.Root>
            );

        case "number":
            return (
                <Field.Root required={fieldInput.required}>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <NumericInput
                        value={value as number | undefined}
                        onNumberChange={onChange}
                        placeholder={fieldInput.placeholder ?? EM_DASH}
                        min={fieldInput.min}
                        max={fieldInput.max}
                        step={fieldInput.step}
                        showSteppers={fieldInput.showSteppers}
                        formatOptions={{ maximumFractionDigits: fieldInput.precision }}
                    />
                </Field.Root>
            );

        case "check-box":
            return (
                <Field.Root required={fieldInput.required}>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <Checkbox.Root checked={!!value} onCheckedChange={onCheckBoxChange}>
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>
                            {fieldInput.checkBoxLabel ?? fieldInput.label}
                        </Checkbox.Label>
                    </Checkbox.Root>
                </Field.Root>
            );

        case "select":
            return (
                <Field.Root required={true}>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <NativeSelectRoot>
                        <NativeSelectField
                            placeholder={EM_DASH}
                            value={value as string | number | undefined}
                            onChange={onInputChange}
                        >
                            {fieldInput.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </NativeSelectField>
                        <NativeSelectIndicator />
                    </NativeSelectRoot>
                </Field.Root>
            );

        case "date":
            return (
                <Field.Root required={fieldInput.required}>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                        type="date"
                        placeholder={fieldInput.placeholder ?? fieldInput.label}
                        value={value?.toString()}
                        onChange={onInputChange}
                    />
                </Field.Root>
            );

        case "color":
            return (
                <Field.Root>
                    <Field.Label>
                        {fieldInput.label}
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <ColorPickerInput
                        hexColor={value?.toString()}
                        colors={fieldInput.colors}
                        onChange={onChange}
                    />
                </Field.Root>
            );
    }
}

const EM_DASH = "\u2014";

export interface DefaultInputControlProps {
    readonly fieldInput: FieldInput;
}

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
