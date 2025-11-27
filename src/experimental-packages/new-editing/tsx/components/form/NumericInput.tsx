// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    type NumberInputProps
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import type { Callback } from "../../types/types";

// This component allows its value to be specified as a number. The value is still stored as a
// string internally to allow non-numeric characters (such as '-', '.', or 'e') to be entered.
export function NumericInput({
    value,
    onNumberChange,
    placeholder = EM_DASH,
    showSteppers = true,
    min,
    max,
    step,
    precision,
    ...props
}: NumericInputProps): ReactElement {
    const [stringValue, setStringValue] = useState(() => toString(value, precision));
    const setNumericValue = useNumericState(value, precision, setStringValue);

    const onChange = useCallback(
        (newStringValue: string, newNumericValue: number) => {
            setStringValue(newStringValue);
            if (!isNaN(newNumericValue)) {
                setNumericValue(newNumericValue);
                onNumberChange?.(newNumericValue);
            } else if (newStringValue === "") {
                setNumericValue(undefined);
                onNumberChange?.(undefined);
            }
        },
        [setNumericValue, onNumberChange]
    );

    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <NumberInput
            {...props}
            min={min}
            max={max}
            step={step}
            precision={precision}
            value={stringValue ?? ""}
            onChange={onChange}
        >
            <NumberInputField ref={inputRef} placeholder={placeholder} />
            {showSteppers && (
                <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                </NumberInputStepper>
            )}
        </NumberInput>
    );
}

// Additionally store the state as a number to be able to react to outside changes of 'value'.
function useNumericState(
    value: number | undefined,
    precision: number | undefined,
    setStringValue: (newValue: string | undefined) => void
): (newValue: number | undefined) => void {
    const [numericValue, setNumericValue] = useState(value);

    useEffect(() => {
        if (value !== numericValue) {
            setStringValue(toString(value, precision));
            setNumericValue(value);
        }
    }, [value, precision, numericValue, setStringValue]);

    return setNumericValue;
}

function toString(number: number | undefined, precision: number | undefined): string | undefined {
    return precision != null ? number?.toFixed(precision) : number?.toString();
}

const EM_DASH = "\u2014";

interface NumericInputProps extends NumberInputProps {
    readonly value: number | undefined;
    readonly placeholder?: string;
    readonly showSteppers?: boolean;
    readonly onNumberChange?: Callback<number | undefined>;
}
