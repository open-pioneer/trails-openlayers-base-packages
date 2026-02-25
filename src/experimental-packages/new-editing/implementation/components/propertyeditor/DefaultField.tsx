// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Field } from "@chakra-ui/react";
import type { ReactElement } from "react";

import { DefaultControl } from "../controls/DefaultControl";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { FieldConfig } from "../../../api/fields/FieldConfig";
import type { PropertyFunction, PropertyFunctionOr } from "../../../api/fields/BaseFieldConfig";

export function DefaultField({ field }: DefaultFieldProps): ReactElement | undefined {
    const isRequired = useValue(field.isRequired) ?? false;
    const isEnabled = useValue(field.isEnabled) ?? true;
    const isVisible = useValue(field.isVisible) ?? true;
    const isValid = useValue(field.isValid) ?? true;
    const errorText = useValue(field.errorText);
    const helperText = useValue(field.helperText);

    if (isVisible) {
        return (
            <Field.Root required={isRequired} disabled={!isEnabled} invalid={!isValid}>
                <Field.Label>
                    {field.label}
                    <Field.RequiredIndicator />
                </Field.Label>
                <DefaultControl field={field} />
                {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
                {errorText && <Field.ErrorText>{errorText}</Field.ErrorText>}
            </Field.Root>
        );
    } else {
        return undefined;
    }
}

function useValue<T>(value: PropertyFunctionOr<T> | undefined): T | undefined {
    const context = usePropertyFormContext();

    return useReactiveSnapshot(() => {
        if (isPropertyFunction(value)) {
            const properties = context.propertiesObject();
            return value(properties);
        } else {
            return value;
        }
    }, [context, value]);
}

function isPropertyFunction<T>(value: PropertyFunctionOr<T>): value is PropertyFunction<T> {
    return typeof value === "function";
}

interface DefaultFieldProps {
    readonly field: FieldConfig;
}
