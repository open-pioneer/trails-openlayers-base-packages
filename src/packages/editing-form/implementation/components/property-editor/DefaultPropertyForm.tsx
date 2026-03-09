// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { VStack } from "@chakra-ui/react";
import { effect } from "@conterra/reactivity-core";
import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { FormTemplateContext } from "../../../api/editor/editor";
import type { PropertyFunctionOr } from "../../../api/fields/BaseFieldConfig";
import type { FieldConfig } from "../../../api/fields/FieldConfig";
import type { FeatureTemplate, FormTemplate } from "../../../api/model/FeatureTemplate";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import { Header } from "../header/Header";
import { DefaultField } from "./DefaultField";

export interface DefaultPropertyFormProps {
    readonly title: string | undefined;
    readonly templates: FeatureTemplate[];
    readonly resolveFormTemplate?: (context: FormTemplateContext) => FormTemplate | undefined;
}

export function DefaultPropertyForm({
    title,
    templates,
    resolveFormTemplate
}: DefaultPropertyFormProps): ReactElement {
    const template = useFormTemplate(templates, resolveFormTemplate);
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

function useFormTemplate(
    templates: FeatureTemplate[],
    customResolver: DefaultPropertyFormProps["resolveFormTemplate"]
): FormTemplate | undefined {
    const { mode, feature, template: explicitTemplate, layer } = usePropertyFormContext();
    const defaultResolver = useDefaultFormTemplateResolver(templates);
    const resolveFormTemplate = customResolver ?? defaultResolver;

    return useMemo(() => {
        if (explicitTemplate) {
            return explicitTemplate;
        } else if (mode === "update") {
            return resolveFormTemplate({ feature, layer });
        } else {
            return undefined;
        }
    }, [feature, mode, explicitTemplate, layer, resolveFormTemplate]);
}

function useDefaultFormTemplateResolver(templates: FeatureTemplate[]) {
    return useCallback(
        ({ layer }: FormTemplateContext) => {
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
                const properties = context.propertiesObject;
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
