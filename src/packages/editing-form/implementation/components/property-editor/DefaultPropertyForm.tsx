// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, VStack } from "@chakra-ui/react";
import { effect } from "@conterra/reactivity-core";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useCallback, useEffect, useMemo, type ReactElement } from "react";
import { FormTemplateContext } from "../../../api/editor/editor";
import type { PropertyFunctionOr } from "../../../api/fields/BaseFieldConfig";
import type { FieldConfig } from "../../../api/fields/FieldConfig";
import type { FeatureTemplate, FormTemplate } from "../../../api/model/FeatureTemplate";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import { DefaultField } from "./DefaultField";
import { useIntl } from "open-pioneer:react-hooks";

export interface DefaultPropertyFormProps {
    readonly templates: FeatureTemplate[];
    readonly resolveFormTemplate?: (context: FormTemplateContext) => FormTemplate | undefined;
}

export function DefaultPropertyForm({
    templates,
    resolveFormTemplate
}: DefaultPropertyFormProps): ReactElement {
    const template = useFormTemplate(templates, resolveFormTemplate);
    const heading = useHeading(template);
    useUpdateValidity(template);

    return (
        <Flex direction="column" height="full">
            <TitledSection>
                <SectionHeading mb={2} size="sm">
                    {heading}
                </SectionHeading>
                <Box flex={1} overflowY="auto">
                    <VStack gap={4} align="stretch" px="1px">
                        {template?.kind === "dynamic"
                            ? template.renderForm()
                            : template?.fields.map((field, index) => (
                                  <DefaultField key={index} field={field} />
                              ))}
                    </VStack>
                </Box>
            </TitledSection>
        </Flex>
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

function useHeading(template: FormTemplate | undefined) {
    const intl = useIntl();
    const { mode } = usePropertyFormContext();
    const defaultHeading = intl.formatMessage({
        id:
            mode === "update"
                ? "propertyEditor.defaultEditHeading"
                : "propertyEditor.defaultCreateHeading"
    });
    return template?.name ?? defaultHeading;
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
                const properties = context.getPropertiesAsObject();
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
