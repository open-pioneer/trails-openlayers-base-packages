// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { useMapModelValue } from "@open-pioneer/map";
import { useCommonComponentProps } from "@open-pioneer/react-utils";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { useIntl } from "open-pioneer:react-hooks";
import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import type { FeatureEditorProps, FormTemplateContext } from "../api/editor/editor";
import { CreationStep, UpdateStep } from "../api/model/EditingStep";
import { FeatureTemplate, FormTemplate } from "../api/model/FeatureTemplate";
import { ActionSelector } from "./components/action-selector/ActionSelector";
import { PropertyEditor } from "./components/property-editor/PropertyEditor";
import { PropertyField } from "./components/property-editor/PropertyField";
import { PropertyForm } from "./components/property-editor/PropertyForm";
import {
    CustomFormContext,
    DeclarativeFormContext,
    FormContext
} from "./context/PropertyFormContext";
import { useEditingStep, useOnActionChange, useSnappingSources } from "./editor/editorHooks";
import { EditingCallbacks, useEditingCallbacks } from "./editor/useEditingCallbacks";
import { TooltipMessages } from "./geometry-editing/controller/EditingController";
import { useGeometryEditing } from "./geometry-editing/useGeometryEditing";

export function FeatureEditor(props: FeatureEditorProps): ReactElement {
    const {
        map,
        templates,
        writer,
        resolveFormTemplate,
        selectableLayers,
        snappableLayers = selectableLayers,
        showActionBar = true,
        successNotifierDisplayDuration,
        failureNotifierDisplayDuration,
        onEditingStepChange,
        ...interactionOptions
    } = props;
    const { containerProps } = useCommonComponentProps("editor", props);
    const mapModel = useMapModelValue(props);
    const intl = useIntl();

    const [editingStep, setEditingStep] = useEditingStep(onEditingStepChange);
    const snappingSources = useSnappingSources(mapModel, snappableLayers, templates);
    const onActionChange = useOnActionChange(mapModel, selectableLayers, templates, setEditingStep);

    const tooltipMessages = useMemo((): TooltipMessages => {
        return {
            getDrawingMessages() {
                return new Map<GeometryType, ReactNode>([
                    ["Point", intl.formatRichMessage({ id: "tooltips.drawingMessagePoint" })],
                    [
                        "LineString",
                        intl.formatRichMessage({ id: "tooltips.drawingMessageLineString" })
                    ],
                    ["Polygon", intl.formatRichMessage({ id: "tooltips.drawingMessagePolygon" })],
                    ["Circle", intl.formatRichMessage({ id: "tooltips.drawingMessageCircle" })]
                ]);
            },
            getSelectionMessage() {
                return intl.formatRichMessage({ id: "tooltips.selectionMessage" });
            },
            getModificationMessages() {
                return new Map<string, ReactNode>([
                    ["Point", intl.formatRichMessage({ id: "tooltips.modificationMessagePoint" })],
                    ["default", intl.formatRichMessage({ id: "tooltips.modificationMessage" })]
                ]);
            }
        };
    }, [intl]);

    const drawingState = useGeometryEditing({
        map,
        editingStep,
        setEditingStep,
        snappingSources,
        tooltipMessages,
        ...interactionOptions
    });

    const editingCallbacks = useEditingCallbacks(
        mapModel,
        editingStep,
        writer,
        setEditingStep,
        successNotifierDisplayDuration,
        failureNotifierDisplayDuration
    );

    let content: ReactNode;
    switch (editingStep.id) {
        case "initial":
        case "drawing":
        case "selection":
            content = (
                <ActionSelector
                    templates={templates}
                    showActionBar={showActionBar}
                    onActionChange={onActionChange}
                    drawingState={drawingState}
                />
            );
            break;
        case "creation":
        case "update":
            content = (
                <EditingWorkflow
                    editingStep={editingStep}
                    callbacks={editingCallbacks}
                    templates={templates}
                    resolveFormTemplate={resolveFormTemplate}
                />
            );
            break;
    }

    return (
        <Box {...containerProps} h="full">
            {content}
        </Box>
    );
}

function EditingWorkflow(props: {
    editingStep: CreationStep | UpdateStep;
    callbacks: EditingCallbacks;
    templates: FeatureTemplate[];
    resolveFormTemplate: FeatureEditorProps["resolveFormTemplate"];
}) {
    const { editingStep, callbacks, templates, resolveFormTemplate } = props;
    const formTemplate = useFormTemplate(templates, resolveFormTemplate, editingStep);

    const context = useMemo(() => {
        if (!formTemplate) {
            return undefined;
        }

        if (formTemplate.kind === "declarative") {
            return new DeclarativeFormContext(editingStep, callbacks, formTemplate);
        } else {
            return new CustomFormContext(editingStep, callbacks, formTemplate);
        }
    }, [formTemplate, editingStep, callbacks]);

    return (
        context &&
        formTemplate && (
            <FormContext value={context}>
                <PropertyEditor>
                    <PropertyForm>
                        {formTemplate.kind === "dynamic"
                            ? formTemplate.renderForm()
                            : formTemplate.fields.map((field, index) => (
                                  <PropertyField key={index} field={field} />
                              ))}
                    </PropertyForm>
                </PropertyEditor>
            </FormContext>
        )
    );
}

function useFormTemplate(
    templates: FeatureTemplate[],
    customResolver: FeatureEditorProps["resolveFormTemplate"],
    editingStep: CreationStep | UpdateStep
): FormTemplate | undefined {
    const defaultResolver = useDefaultFormTemplateResolver(templates);
    const resolveFormTemplate = customResolver ?? defaultResolver;

    const feature = editingStep.feature;
    const layer = editingStep.id === "update" ? editingStep.layer : undefined;
    const explicitTemplate = editingStep.id === "creation" ? editingStep.template : undefined;

    return useMemo(() => {
        if (explicitTemplate) {
            return explicitTemplate;
        } else if (editingStep.id === "update") {
            return resolveFormTemplate({ feature, layer });
        } else {
            return undefined;
        }
    }, [explicitTemplate, editingStep.id, feature, layer, resolveFormTemplate]);
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
