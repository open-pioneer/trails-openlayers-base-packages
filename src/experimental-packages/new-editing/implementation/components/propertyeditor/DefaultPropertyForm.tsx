// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { VStack } from "@chakra-ui/react";
import { effect } from "@conterra/reactivity-core";
import { useCallback, useEffect, useMemo, type ReactElement } from "react";

import { DefaultField } from "./DefaultField";
import { Header } from "../header/Header";

import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import type { FieldConfig } from "../../../api/fields/FieldConfig";
import type { PropertyFunctionOr } from "../../../api/fields/BaseFieldConfig";

import type {
    FeatureTemplate,
    FormTemplate,
    FormTemplateProvider
} from "../../../api/model/FeatureTemplate";

export function DefaultPropertyForm({
    title,
    templates,
    formTemplateProvider
}: DefaultPropertyFormProps): ReactElement {
    const defaultProvider = useDefaultFormTemplateProvider(templates);
    const template = useFormTemplate(formTemplateProvider ?? defaultProvider);
    useUpdateValidity(template);

    return (
        <Header title={title} template={template}>
            <VStack gap={4} align="stretch" px="1px">
                {template?.kind === "dynamic"
                    ? template.renderForm()
                    : template?.fields.map((field, index) => (
                          <DefaultField key={index} field={field} />
                      ))}
            </VStack>
        </Header>
    );
}

function useFormTemplate(provider: FormTemplateProvider): FormTemplate | undefined {
    const { mode, feature, template, layer } = usePropertyFormContext();

    return useMemo(() => {
        if (template != null) {
            return template;
        } else if (mode === "update") {
            return provider(feature, layer);
        } else {
            return undefined;
        }
    }, [feature, mode, template, layer, provider]);
}

function useDefaultFormTemplateProvider(templates: FeatureTemplate[]): FormTemplateProvider {
    return useCallback(
        (_, layer) => {
            if (layer?.id != null) {
                return templates.find(({ layerId }) => layer.id === layerId);
            } else {
                return undefined;
            }
        },
        [templates]
    );
}

function useUpdateValidity(template: FormTemplate | undefined): void {
    const context = usePropertyFormContext();

    useEffect(() => {
        const handle = effect(() => {
            if (template?.kind === "declarative") {
                const properties = context.propertiesObject();
                context.isValid = template.fields.every((field) => isValid(field, properties));
            }
        });
        return () => handle.destroy();
    }, [context, template]);
}

function isValid(field: FieldConfig, properties: Record<string, unknown>): boolean {
    return (
        (!isTrue(field.isRequired, properties) || properties[field.propertyName] != null) &&
        isTrue(field.isValid, properties, true)
    );
}

function isTrue(
    value: PropertyFunctionOr<boolean> | undefined,
    properties: Record<string, unknown>,
    defaultValue: boolean = false
): boolean {
    return typeof value === "function" ? value(properties) : (value ?? defaultValue);
}

export interface DefaultPropertyFormProps {
    readonly title: string | undefined;
    readonly templates: FeatureTemplate[];
    readonly formTemplateProvider: FormTemplateProvider | undefined;
}
