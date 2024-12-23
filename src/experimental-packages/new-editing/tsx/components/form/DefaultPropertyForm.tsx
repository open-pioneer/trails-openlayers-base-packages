// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { VStack } from "@open-pioneer/chakra-integration";
import type { Feature } from "ol";
import type { Layer } from "ol/layer";
import { useEffect, useMemo, type ReactElement } from "react";

import { DefaultInputControl, } from "./DefaultInputControl";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { FeatureTemplate, FieldInput } from "../../model/FeatureTemplate";

export function DefaultPropertyForm(
    { fieldInputsProvider }: DefaultPropertyFormProps
): ReactElement {
    const fieldInputs = useFieldInputs(fieldInputsProvider);
    useUpdateValidity(fieldInputs);

    return (
        <VStack spacing={4} align="stretch">
            {fieldInputs.map((fieldInput, index) => (
                <DefaultInputControl key={index} fieldInput={fieldInput} />
            ))}
        </VStack>
    );
}

function useFieldInputs(provider: FieldInputsProvider | undefined): FieldInput[] {
    const { feature, mode, template, layer } = usePropertyFormContext();

    return useMemo(() => {
        if (mode === "create") {
            const fieldInputs = provider?.getFieldInputsForNewFeature?.(feature, template);
            return fieldInputs ?? template.fieldInputs ?? [];
        } else {
            const fieldInputs = provider?.getFieldInputsForExistingFeature?.(feature, layer);
            return fieldInputs ?? [];
        }
    }, [feature, mode, template, layer, provider]);
}

function useUpdateValidity(fieldInputs: FieldInput[]): void {
    const { properties, setValid } = usePropertyFormContext();

    useEffect(() => {
        const isValid = fieldInputs.every(({ required, fieldName }) => {
            return !required || properties[fieldName] != null;
        });
        setValid(isValid);
    }, [fieldInputs, properties, setValid]);
}

export interface DefaultPropertyFormProps {
    readonly fieldInputsProvider: FieldInputsProvider | undefined;
}

export interface FieldInputsProvider {
    readonly getFieldInputsForNewFeature?: (
        feature: Feature,
        template: FeatureTemplate
    ) => FieldInput[] | undefined;

    readonly getFieldInputsForExistingFeature?: (
        feature: Feature,
        layer: Layer | undefined
    ) => FieldInput[] | undefined;
}
