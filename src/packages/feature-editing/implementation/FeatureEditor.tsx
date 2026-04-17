// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { useMapModelValue } from "@open-pioneer/map";
import { useCommonComponentProps } from "@open-pioneer/react-utils";
import { type ReactElement, type ReactNode, useMemo } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import type { FeatureEditorProps } from "../api/editor/editor";
import { ActionSelector } from "./components/action-selector/ActionSelector";
import { PropertyForm } from "./components/property-editor/PropertyForm";
import { PropertyEditor } from "./components/property-editor/PropertyEditor";
import { PropertyFormContextProvider } from "./context/PropertyFormContextProvider";
import { useEditingStep, useOnActionChange, useSnappingSources } from "./editor/editorHooks";
import { useEditingCallbacks } from "./editor/useEditingCallbacks";
import { useGeometryEditing } from "./geometry-editing/useGeometryEditing";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { TooltipMessages } from "./geometry-editing/controller/EditingController";

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
