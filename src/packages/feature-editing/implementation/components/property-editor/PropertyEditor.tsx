// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Flex, useDisclosure } from "@chakra-ui/react";
import { createLogger } from "@open-pioneer/core";
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { sourceId } from "open-pioneer:source-info";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { FeatureEditorProps, FormTemplateContext } from "../../../api/editor/editor";
import { CreationStep, UpdateStep } from "../../../api/model/EditingStep";
import { FeatureTemplate, FormTemplate } from "../../../api/model/FeatureTemplate";
import {
    AnyPropertyFormContext,
    CustomFormContextImpl,
    DeclarativeFormContext,
    FormContext
} from "../../context/PropertyFormContext";
import { usePropertyFormContext } from "../../context/usePropertyFormContext";
import { EditingCallbacks } from "../../editor/useEditingCallbacks";
import { ButtonRow } from "./ButtonRow";
import { CancelConfirmationDialog } from "./CancelConfirmationDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { PropertyField } from "./PropertyField";
import { PropertyForm } from "./PropertyForm";

const LOG = createLogger(sourceId);

export function PropertyEditor(props: {
    editingStep: CreationStep | UpdateStep;
    callbacks: EditingCallbacks;
    templates: FeatureTemplate[];
    resolveFormTemplate: FeatureEditorProps["resolveFormTemplate"];
}) {
    const { editingStep, callbacks, templates, resolveFormTemplate } = props;
    const formTemplate = useFormTemplate(templates, resolveFormTemplate, editingStep);

    const [context, setContext] = useState<AnyPropertyFormContext>();
    useEffect(() => {
        if (!formTemplate) {
            return undefined;
        }

        let ctx;
        if (formTemplate.kind === "declarative") {
            ctx = new DeclarativeFormContext(editingStep, callbacks, formTemplate);
        } else {
            ctx = new CustomFormContextImpl(editingStep, callbacks, formTemplate);
        }
        setContext(ctx);
        return () => {
            ctx.destroy();
            setContext(undefined);
        };
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
                                  // oxlint-disable-next-line react/no-array-index-key
                                  <PropertyField key={index} field={field} />
                              ))}
                    </PropertyForm>
                    <EditorControls />
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

    const onCancelClick = useEvent(() => {
        if (!context.didEdit) {
            LOG.debug(
                "Skipping cancel conformation dialog because the user did not edit the feature"
            );
            onConfirmCancelClick();
        } else {
            openCancelDialog();
        }
    });

    return (
        <>
            <ButtonRow
                canSave={canSave}
                showDeleteButton={context.mode === "update"}
                onSave={onSaveClick}
                onDelete={openDeleteDialog}
                onCancel={onCancelClick}
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
