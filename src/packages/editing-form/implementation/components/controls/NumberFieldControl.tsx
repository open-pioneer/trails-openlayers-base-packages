// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { NumberInput, type NumberInputValueChangeDetails } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import type { NumberFieldConfig } from "../../../api/fields/standardFieldConfigs";

// This component allows its value to be specified as a number. The value is still stored as a
// string internally to allow non-numeric characters (such as '-', '.', or 'e') to be entered.
export function NumberFieldControl({
    value,
    field,
    onChange
}: NumberFieldControlProps): ReactElement {
    const formatNumber = useFormatNumber(field.formatOptions);
    const [stringValue, setStringValue] = useState(() => formatNumber(value));
    const setNumericValue = useNumericState(value, field.formatOptions, setStringValue);

    const onValueChange = useEvent(({ value, valueAsNumber }: NumberInputValueChangeDetails) => {
        setStringValue(value);
        if (!isNaN(valueAsNumber)) {
            setNumericValue(valueAsNumber);
            onChange?.(valueAsNumber);
        } else if (value === "") {
            setNumericValue(undefined);
            onChange?.(undefined);
        }
    });

    const element = useRef<HTMLInputElement>(null);

    return (
        <NumberInput.Root
            value={stringValue ?? ""}
            min={field.min}
            max={field.max}
            step={field.step}
            formatOptions={field.formatOptions}
            onValueChange={onValueChange}
        >
            <NumberInput.Input ref={element} placeholder={field.placeholder ?? field.label} />
            {field.showSteppers && <NumberInput.Control />}
        </NumberInput.Root>
    );
}

// Additionally store the state as a number to be able to react to outside changes of 'value'.
function useNumericState(
    value: number | undefined,
    formatOptions: Intl.NumberFormatOptions | undefined,
    setStringValue: (newValue: string | undefined) => void
) {
    const [numericValue, setNumericValue] = useState(value);
    const formatNumber = useFormatNumber(formatOptions);

    useEffect(() => {
        if (value !== numericValue) {
            const stringValue = formatNumber(value);
            setStringValue(stringValue);
            setNumericValue(value);
        }
    }, [formatNumber, numericValue, setStringValue, value]);

    return setNumericValue;
}

function useFormatNumber(formatOptions: Intl.NumberFormatOptions | undefined) {
    const { formatNumber } = useIntl();

    return useCallback(
        (number: number | undefined) => {
            if (number != null) {
                return formatNumber(number, { maximumFractionDigits: 20, ...formatOptions });
            } else {
                return undefined;
            }
        },
        [formatNumber, formatOptions]
    );
}

interface NumberFieldControlProps {
    readonly value: number | undefined;
    readonly field: NumberFieldConfig;
    readonly onChange: (newNumber: number | undefined) => void;
}
