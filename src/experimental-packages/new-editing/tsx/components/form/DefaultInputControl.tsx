// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Checkbox,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea
} from "@chakra-ui/react";

import { ChangeEvent, useCallback, type ReactElement } from "react";

import { NumericInput } from "./NumericInput";
import { ColorPicker } from "./ColorPicker";
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
        (event: ChangeEvent<HTMLInputElement>) => {
            setProperty(fieldName, event.target.checked);
        },
        [fieldName, setProperty]
    );

    switch (fieldInput.inputType) {
        case "textField":
            return (
                <FormControl isRequired={fieldInput.required}>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <Input
                        type="text"
                        placeholder={fieldInput.placeholder ?? fieldInput.label}
                        value={value?.toString() ?? ""}
                        onChange={onInputChange}
                    />
                </FormControl>
            );

        case "textArea":
            return (
                <FormControl isRequired={fieldInput.required}>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <Textarea
                        placeholder={fieldInput.placeholder ?? fieldInput.label}
                        value={value?.toString()}
                        onChange={onInputChange}
                    />
                </FormControl>
            );

        case "number":
            return (
                <FormControl isRequired={fieldInput.required}>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <NumericInput
                        value={value as number | undefined}
                        onNumberChange={onChange}
                        placeholder={fieldInput.placeholder ?? EM_DASH}
                        min={fieldInput.min}
                        max={fieldInput.max}
                        precision={fieldInput.precision}
                        step={fieldInput.step}
                        showSteppers={fieldInput.showSteppers}
                    />
                </FormControl>
            );

        case "checkBox":
            return (
                <FormControl isRequired={fieldInput.required}>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <Checkbox isChecked={!!value} onChange={onCheckBoxChange}>
                        {fieldInput.checkBoxLabel ?? fieldInput.label}
                    </Checkbox>
                </FormControl>
            );

        case "select":
            return (
                <FormControl isRequired={fieldInput.required}>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <Select
                        placeholder={EM_DASH}
                        value={value as string | number | undefined}
                        onChange={onInputChange}
                    >
                        {fieldInput.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </FormControl>
            );

        case "date":
            return (
                <FormControl isRequired={fieldInput.required}>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <Input
                        type="date"
                        placeholder={fieldInput.placeholder ?? fieldInput.label}
                        value={value?.toString()}
                        onChange={onInputChange}
                    />
                </FormControl>
            );

        case "color":
            return (
                <FormControl>
                    <FormLabel>{fieldInput.label}</FormLabel>
                    <ColorPicker hexColor={value?.toString()} onChange={onChange} />
                </FormControl>
            );
    }
}

const EM_DASH = "\u2014";

export interface DefaultInputControlProps {
    readonly fieldInput: FieldInput;
}

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
