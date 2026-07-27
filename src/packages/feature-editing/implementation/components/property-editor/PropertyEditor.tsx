// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex, useDisclosure } from "@chakra-ui/react";
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useCallback, useMemo, type ReactElement } from "react";
import { ButtonRow } from "./ButtonRow";
import { CancelConfirmationDialog } from "./CancelConfirmationDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { FeatureEditorProps, FormTemplateContext } from "../../../api/editor/editor";
import { CreationStep, UpdateStep } from "../../../api/model/EditingStep";
import { FeatureTemplate, FormTemplate } from "../../../api/model/FeatureTemplate";
import {
    DeclarativeFormContext,
    CustomFormContextImpl,
    FormContext
} from "../../context/PropertyFormContext";
import { EditingCallbacks } from "../../editor/useEditingCallbacks";
import { PropertyField } from "./PropertyField";
import { PropertyForm } from "./PropertyForm";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";

export function PropertyEditor(props: {
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
            return new CustomFormContextImpl(editingStep, callbacks, formTemplate);
        }
    }, [formTemplate, editingStep, callbacks]);

    return (
        context &&
        formTemplate && (
            <FormContext value={context}>
                <Flex
                    className="editor__property-editor"
                    direction="column"
                    height="full"
                    overflowY={"hidden"}
                >
                    <PropertyForm>
                        {formTemplate.kind === "dynamic"
                            ? formTemplate.renderForm()
                            : formTemplate.fields.map((field, index) => (
                                  <PropertyField key={index} field={field} />
                              ))}
                    </PropertyForm>
                    <EditorControls></EditorControls>
                </Flex>
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

function EditorControls(): ReactElement {
    const context = usePropertyFormContext();
    const canSave = useReactiveSnapshot(() => context.isValid, [context]);

    const {
        open: deleteDialogIsOpen,
        onOpen: openDeleteDialog,
        onClose: closeDeleteDialog
    } = useDisclosure();
    const {
        open: cancelDialogIsOpen,
        onOpen: openCancelDialog,
        onClose: closeCancelConfirmationDialog
    } = useDisclosure();

    const onSaveClick = useEvent(async () => {
        const properties = context.getPropertiesAsObject();
        context.feature.setProperties(properties);
        await context.callbacks.onSave();
    });

    const onDeleteClick = useEvent(async () => {
        await context.callbacks.onDelete();
        closeDeleteDialog();
    });

    const onConfirmCancelClick = useEvent(() => {
        context.callbacks.onCancel();
        closeCancelConfirmationDialog();
    });

    return (
        <>
            <ButtonRow
                canSave={canSave}
                showDeleteButton={context.mode === "update"}
                onSave={onSaveClick}
                onDelete={openDeleteDialog}
                onCancel={openCancelDialog}
            />
            <DeleteConfirmationDialog
                isOpen={deleteDialogIsOpen}
                onDelete={onDeleteClick}
                onCancel={closeDeleteDialog}
            />
            <CancelConfirmationDialog
                isOpen={cancelDialogIsOpen}
                onConfirmCancel={onConfirmCancelClick}
                onAbortCancel={closeCancelConfirmationDialog}
            />
        </>
    );
}
