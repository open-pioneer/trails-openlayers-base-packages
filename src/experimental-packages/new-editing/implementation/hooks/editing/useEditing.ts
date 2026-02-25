// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModelValue, type MapModel } from "@open-pioneer/map";
import { useEffect, useMemo } from "react";

import { EditingController } from "./controller/EditingController";
import type { DrawingState } from "../../../api/model/DrawingState";
import type { EditingOptions } from "../../../api/editor/editing";

export function useEditing({
    map,
    editingStep,
    setEditingStep,
    snappingSources,
    ...interactionOptions
}: EditingOptions): DrawingState {
    const controller = useEditingController(map);

    useEffect(() => {
        controller.setSnappingSources(snappingSources);
        controller.setInteractionOptions(interactionOptions);
    }, [controller, snappingSources, interactionOptions]);

    useEffect(() => {
        switch (editingStep.id) {
            case "none":
                controller.stopCurrentInteraction();
                break;

            case "create-draw":
                controller.startDrawingFeature({
                    geometryType: editingStep.template.geometryType,
                    drawingOptions: editingStep.template.drawingOptions ?? {},
                    completionHandler(feature, drawOlLayer) {
                        const template = editingStep.template;
                        feature.setProperties(template.prototype ?? {});
                        setEditingStep({ id: "create-modify", feature, template, drawOlLayer });
                    }
                });
                break;

            case "update-select":
                controller.startSelectingFeature({
                    layers: editingStep.layers,
                    completionHandler(feature, olLayer) {
                        setEditingStep({ id: "update-modify", feature, layer: olLayer });
                    }
                });
                break;

            case "create-modify":
                controller.startModifyingFeature({
                    feature: editingStep.feature,
                    drawLayer: editingStep.drawOlLayer
                });
                break;

            case "update-modify":
                controller.startModifyingFeature({
                    feature: editingStep.feature
                });
                break;
        }
    }, [controller, editingStep, setEditingStep]);

    return controller.drawingState;
}

function useEditingController(map: MapModel | undefined): EditingController {
    const mapModel = useMapModelValue({ map });
    return useMemo(() => new EditingController(mapModel), [mapModel]);
}
