// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { useMapModelValue } from "@open-pioneer/map";
import { useCommonComponentProps } from "@open-pioneer/react-utils";
import type { ReactElement, ReactNode } from "react";
import type { FeatureEditorProps } from "../api/editor/editor";
import { ActionSelector } from "./components/action-selector/ActionSelector";
import { PropertyForm } from "./components/property-editor/PropertyForm";
import { PropertyEditor } from "./components/property-editor/PropertyEditor";
import { PropertyFormContextProvider } from "./context/PropertyFormContextProvider";
import { useEditingStep, useOnActionChange, useSnappingSources } from "./editor/editorHooks";
import { useEditingCallbacks } from "./editor/useEditingCallbacks";
import { useGeometryEditing } from "./geometry-editing/useGeometryEditing";

export function Editor(props: FeatureEditorProps): ReactElement {
    const {
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
    } = props;
    const { containerProps } = useCommonComponentProps("editor", props);
    const mapModel = useMapModelValue(props);

    const [editingStep, setEditingStep] = useEditingStep(onEditingStepChange);
    const snappingSources = useSnappingSources(mapModel, snappableLayers, templates);
    const onActionChange = useOnActionChange(mapModel, selectableLayers, templates, setEditingStep);

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
                <PropertyFormContextProvider editingStep={editingStep} callbacks={editingCallbacks}>
                    <PropertyEditor>
                        <PropertyForm
                            templates={templates}
                            resolveFormTemplate={resolveFormTemplate}
                        />
                    </PropertyEditor>
                </PropertyFormContextProvider>
            );
            break;
    }

    return (
        <Box {...containerProps} h="full">
            {content}
        </Box>
    );
}
