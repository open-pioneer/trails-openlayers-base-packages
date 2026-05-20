// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Field } from "@chakra-ui/react";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useMemo, useState, type ReactElement } from "react";
import type { PropertyFunction, PropertyFunctionOr } from "../../../api/fields/BaseFieldConfig";
import type { FieldConfig } from "../../../api/fields/FieldConfig";
import { DeclarativeFormContext } from "../../context/PropertyFormContext";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import { DefaultControl } from "../controls/DefaultControl";
import { useIntl } from "open-pioneer:react-hooks";

export interface PropertyFieldProps {
    readonly field: FieldConfig;
}

export function PropertyField({ field }: PropertyFieldProps): ReactElement | undefined {
    const context = usePropertyFormContext() as DeclarativeFormContext; // TODO: Type check
    const isRequired = useValue(field.isRequired) ?? false;
    const isEnabled = useValue(field.isEnabled) ?? true;
    const isVisible = useValue(field.isVisible) ?? true;
    const isValid = useReactiveSnapshot(() => context.isFieldValid(field), [context, field]);

    const defaultErrorText = useDefaultErrorText(field);
    const errorText = useValue(field.errorText) ?? defaultErrorText;
    const helperText = useValue(field.helperText);

    const [hadFocus, setHadFocus] = useState(false);

    if (isVisible) {
        return (
            <Field.Root
                className="editor__property-field"
                required={isRequired}
                disabled={!isEnabled}
                invalid={hadFocus && !isValid}
                data-editor-property-name={field.propertyName}
                onFocus={() => {
                    setHadFocus(true);
                }}
            >
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

function useDefaultErrorText(field: FieldConfig): string | undefined {
    const intl = useIntl();
    return useMemo(() => {
        if (field.type !== "number-field" || (field.min == null && field.max == null)) {
            return undefined;
        }

        const { min, max } = field;
        let messageId;
        if (min != null && max != null) {
            messageId = "propertyEditor.errors.minAndMax";
        } else if (min != null) {
            messageId = "propertyEditor.errors.minOnly";
        } else {
            messageId = "propertyEditor.errors.maxOnly";
        }
        return intl.formatMessage({ id: messageId }, { min, max });
    }, [intl, field]);
}

function useValue<T>(value: PropertyFunctionOr<T> | undefined): T | undefined {
    const context = usePropertyFormContext();

    return useReactiveSnapshot(() => {
        if (isPropertyFunction(value)) {
            const properties = context.getPropertiesAsObject();
            return value(properties);
        } else {
            return value;
        }
    }, [context, value]);
}

function isPropertyFunction<T>(value: PropertyFunctionOr<T>): value is PropertyFunction<T> {
    return typeof value === "function";
}
