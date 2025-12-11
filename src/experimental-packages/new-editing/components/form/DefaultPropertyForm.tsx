// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { VStack } from "@chakra-ui/react";
import { effect } from "@conterra/reactivity-core";

import type { Feature } from "ol";
import type { Layer } from "ol/layer";

import { useEffect, useMemo, type ReactElement } from "react";

import { DefaultInputControl } from "./DefaultInputControl";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { FeatureTemplate, FieldInput } from "../../model/FeatureTemplate";

export function DefaultPropertyForm({
    fieldInputsProvider
}: DefaultPropertyFormProps): ReactElement {
    const fieldInputs = useFieldInputs(fieldInputsProvider);
    useUpdateValidity(fieldInputs);

    return (
        <VStack gap={4} align="stretch" px="1px">
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
            const fieldInputs =
                template && provider?.getFieldInputsForNewFeature?.(feature, template);
            return fieldInputs ?? template?.fieldInputs ?? [];
        } else {
            const fieldInputs = provider?.getFieldInputsForExistingFeature?.(feature, layer);
            return fieldInputs ?? [];
        }
    }, [feature, mode, template, layer, provider]);
}

function useUpdateValidity(fieldInputs: FieldInput[]): void {
    const context = usePropertyFormContext();

    useEffect(() => {
        const handle = effect(() => {
            context.isValid = fieldInputs.every(({ required, fieldName }) => {
                return !required || context.properties.get(fieldName) != null;
            });
        });
        return () => handle.destroy();
    }, [context, fieldInputs]);
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
