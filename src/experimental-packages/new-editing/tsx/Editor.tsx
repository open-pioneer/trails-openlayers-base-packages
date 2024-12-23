// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModel, type MapModelProps } from "@open-pioneer/map";
import type { ReactElement, ReactNode } from "react";

import { ActionSelector } from "./components/actionselector/ActionSelector";
import { PropertyEditor } from "./components/propertyeditor/PropertyEditor";
import { PropertyFormContextProvider } from "./context/PropertyFormContextProvider";
import {
    DefaultPropertyForm,
    type FieldInputsProvider
} from "./components/form/DefaultPropertyForm";

import {
    useEditingStep,
    useOnActionChangeCallback,
    useSnappingSources
} from "./hooks/editor/editorHooks";
import { useEditingCallbacks } from "./hooks/editor/useEditingCallbacks";
import { useEditing, type InteractionOptions } from "./hooks/editing/useEditing";

import type { EditingHandler } from "./model/EditingHandler";
import type { EditingStep } from "./model/EditingStep";
import type { FeatureTemplate } from "./model/FeatureTemplate";
import type { Callback } from "./types/types";

export function Editor({
    templates,
    editableLayerIds,
    editingHandler,
    showActionBar = true,
    fieldInputsProvider,
    snappableLayerIds = editableLayerIds,
    onEditingStepChange,
    children,
    map,
    mapId,
    ...interactionOptions
}: EditorProps): ReactElement {
    const [editingStep, setEditingStep] = useEditingStep(onEditingStepChange);

    const { map: mapModel } = useMapModel({ map, mapId });
    const onActionChange = useOnActionChangeCallback(mapModel, editableLayerIds, setEditingStep);
    const snappingSources = useSnappingSources(mapModel, snappableLayerIds);

    const { actions, capabilities } = useEditing({
        mapModel,
        editingStep,
        setEditingStep,
        snappingSources,
        ...interactionOptions
    });

    const { onSave, onDelete, onCancel } = useEditingCallbacks(
        mapModel?.olMap,
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
                    canFinish={capabilities.canFinishDrawing}
                    canAbort={capabilities.canAbortDrawing}
                    canUndo={capabilities.canUndo}
                    canRedo={capabilities.canRedo}
                    onFinish={actions.finishDrawing}
                    onAbort={actions.abortDrawing}
                    onUndo={actions.undo}
                    onRedo={actions.redo}
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

export interface EditorProps extends InteractionOptions, MapModelProps {
    readonly templates: FeatureTemplate[];
    readonly editableLayerIds: string[];
    readonly editingHandler: EditingHandler;

    readonly showActionBar?: boolean;
    readonly fieldInputsProvider?: FieldInputsProvider;
    readonly snappableLayerIds?: string[];
    readonly children?: ReactNode[] | ReactNode;

    readonly onEditingStepChange?: OnEditingStepChange;
}

export type OnEditingStepChange = Callback<EditingStep>;
