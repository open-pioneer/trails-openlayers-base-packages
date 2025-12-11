// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { NumberInput, type NumberInputValueChangeDetails } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import { useEffect, useRef, useState, type ReactElement } from "react";

// TODO: Rewrite this (Chakra 2 workarounds likely not needed anymore).

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
    formatOptions,
    ...props
}: NumericInputProps): ReactElement {
    const precision = formatOptions?.maximumFractionDigits;
    const [stringValue, setStringValue] = useState(() => toString(value, precision));
    const setNumericValue = useNumericState(value, precision, setStringValue);

    const onChange = useEvent(({ value, valueAsNumber }: NumberInputValueChangeDetails) => {
        setStringValue(value);
        if (!isNaN(valueAsNumber)) {
            setNumericValue(valueAsNumber);
            onNumberChange?.(valueAsNumber);
        } else if (value === "") {
            setNumericValue(undefined);
            onNumberChange?.(undefined);
        }
    });

    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <NumberInput.Root
            {...props}
            min={min}
            max={max}
            step={step}
            formatOptions={{ maximumFractionDigits: precision }}
            value={stringValue ?? ""}
            onValueChange={onChange}
        >
            <NumberInput.Input ref={inputRef} placeholder={placeholder} />
            {showSteppers && (
                <NumberInput.Control>
                    <NumberInput.IncrementTrigger />
                    <NumberInput.DecrementTrigger />
                </NumberInput.Control>
            )}
        </NumberInput.Root>
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

interface NumericInputProps extends Omit<NumberInput.RootProps, "value" | "onValueChange"> {
    readonly value: number | undefined;
    readonly placeholder?: string;
    readonly showSteppers?: boolean;
    readonly onNumberChange?: (newNumber: number | undefined) => void;
}
