// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModelValue } from "@open-pioneer/map";
import type { ReactElement } from "react";

import { DefaultPropertyForm } from "./components/propertyeditor/DefaultPropertyForm";
import { ActionSelector } from "./components/actionselector/ActionSelector";
import { PropertyEditor } from "./components/propertyeditor/PropertyEditor";

import { PropertyFormContextProvider } from "./context/PropertyFormContextProvider";

import { useEditingStep, useOnActionChange, useSnappingSources } from "./hooks/editor/editorHooks";
import { useEditing } from "./hooks/editing/useEditing";
import { useEditingCallbacks } from "./hooks/editor/useEditingCallbacks";

import type { EditorProps } from "../api/editor/editor";

export function Editor({
    map,
    templates,
    editingHandler,
    formTemplateProvider,
    selectableLayers,
    snappableLayers = selectableLayers,
    title,
    showActionBar = true,
    successNotifierDisplayDuration,
    failureNotifierDisplayDuration,
    onEditingStepChange,
    ...interactionOptions
}: EditorProps): ReactElement {
    const [editingStep, setEditingStep] = useEditingStep(onEditingStepChange);

    const mapModel = useMapModelValue({ map });
    const onActionChange = useOnActionChange(mapModel, selectableLayers, templates, setEditingStep);
    const snappingSources = useSnappingSources(mapModel, snappableLayers, templates);

    const drawingState = useEditing({
        map,
        editingStep,
        setEditingStep,
        snappingSources,
        ...interactionOptions
    });

    const { onSave, onDelete, onCancel } = useEditingCallbacks(
        mapModel,
        editingStep,
        editingHandler,
        setEditingStep,
        successNotifierDisplayDuration,
        failureNotifierDisplayDuration
    );

    switch (editingStep.id) {
        case "none":
        case "create-draw":
        case "update-select":
            return (
                <ActionSelector
                    title={title}
                    templates={templates}
                    showActionBar={showActionBar}
                    onActionChange={onActionChange}
                    drawingState={drawingState}
                />
            );

        case "create-modify":
        case "update-modify":
            return (
                <PropertyFormContextProvider editingStep={editingStep}>
                    <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                        <DefaultPropertyForm
                            title={title}
                            templates={templates}
                            formTemplateProvider={formTemplateProvider}
                        />
                    </PropertyEditor>
                </PropertyFormContextProvider>
            );
    }
}
