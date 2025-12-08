// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModelValue, type MapModelProps } from "@open-pioneer/map";
import type { ReactElement, ReactNode } from "react";

import {
    DefaultPropertyForm,
    type FieldInputsProvider
} from "./components/form/DefaultPropertyForm";

import { ActionSelector } from "./components/actionselector/ActionSelector";
import { PropertyEditor } from "./components/propertyeditor/PropertyEditor";
import { PropertyFormContextProvider } from "./context/PropertyFormContextProvider";

import { useEditingStep, useOnActionChange, useSnappingSources } from "./hooks/editor/editorHooks";
import { useEditingCallbacks } from "./hooks/editor/useEditingCallbacks";
import { useEditing, type InteractionOptions } from "./hooks/editing/useEditing";

import type { EditingHandler } from "./model/EditingHandler";
import type { EditingStep } from "./model/EditingStep";
import type { FeatureTemplate } from "./model/FeatureTemplate";

export function Editor({
    map,
    templates,
    editableLayerIds,
    editingHandler,
    showActionBar = true,
    fieldInputsProvider,
    snappableLayerIds = editableLayerIds,
    onEditingStepChange,
    children,
    ...interactionOptions
}: EditorProps): ReactElement {
    const [editingStep, setEditingStep] = useEditingStep(onEditingStepChange);

    const mapModel = useMapModelValue({ map });
    const onActionChange = useOnActionChange(mapModel, editableLayerIds, setEditingStep);
    const snappingSources = useSnappingSources(mapModel, snappableLayerIds);

    const editingState = useEditing({
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
        setEditingStep
    );

    switch (editingStep.id) {
        case "none":
        case "create-draw":
        case "update-select":
            return (
                <ActionSelector
                    templates={templates}
                    showActionBar={showActionBar}
                    onActionChange={onActionChange}
                    editingState={editingState}
                />
            );

        case "create-modify":
        case "update-modify":
            return (
                <PropertyFormContextProvider editingStep={editingStep}>
                    <PropertyEditor onSave={onSave} onDelete={onDelete} onCancel={onCancel}>
                        {children ?? (
                            <DefaultPropertyForm fieldInputsProvider={fieldInputsProvider} />
                        )}
                    </PropertyEditor>
                </PropertyFormContextProvider>
            );
    }
}

export interface EditorProps extends MapModelProps, InteractionOptions {
    readonly templates: FeatureTemplate[];
    readonly editableLayerIds: string[];
    readonly editingHandler: EditingHandler;

    readonly showActionBar?: boolean;
    readonly fieldInputsProvider?: FieldInputsProvider;
    readonly snappableLayerIds?: string[];
    readonly children?: ReactNode[] | ReactNode;

    readonly onEditingStepChange?: OnEditingStepChange;
}

export type OnEditingStepChange = (newEditingStep: EditingStep) => void;
