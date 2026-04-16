// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModelValue } from "@open-pioneer/map";
import type { ReactElement } from "react";
import type { EditorProps } from "../api/editor/editor";
import { ActionSelector } from "./components/action-selector/ActionSelector";
import { DefaultPropertyForm } from "./components/property-editor/DefaultPropertyForm";
import { PropertyEditor } from "./components/property-editor/PropertyEditor";
import { PropertyFormContextProvider } from "./context/PropertyFormContextProvider";
import { useEditingStep, useOnActionChange, useSnappingSources } from "./editor/editorHooks";
import { useEditingCallbacks } from "./editor/useEditingCallbacks";
import { useGeometryEditing } from "./geometry-editing/useGeometryEditing";

export function Editor({
    map,
    templates,
    storage,
    resolveFormTemplate,
    selectableLayers,
    snappableLayers = selectableLayers,
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

    const drawingState = useGeometryEditing({
        map,
        editingStep,
        setEditingStep,
        snappingSources,
        ...interactionOptions
    });

    const editingCallbacks = useEditingCallbacks(
        mapModel,
        editingStep,
        storage,
        setEditingStep,
        successNotifierDisplayDuration,
        failureNotifierDisplayDuration
    );

    switch (editingStep.id) {
        case "initial":
        case "drawing":
        case "selection":
            return (
                <ActionSelector
                    templates={templates}
                    showActionBar={showActionBar}
                    onActionChange={onActionChange}
                    drawingState={drawingState}
                />
            );

        case "creation":
        case "update":
            return (
                <PropertyFormContextProvider editingStep={editingStep} callbacks={editingCallbacks}>
                    <PropertyEditor>
                        <DefaultPropertyForm
                            templates={templates}
                            resolveFormTemplate={resolveFormTemplate}
                        />
                    </PropertyEditor>
                </PropertyFormContextProvider>
            );
    }
}
