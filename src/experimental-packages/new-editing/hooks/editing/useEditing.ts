// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useMapModelValue, type MapModel, type MapModelProps } from "@open-pioneer/map";
import { useEffect, useMemo } from "react";
import type { Vector as VectorSource } from "ol/source";

import { EditingController, type InteractionOptions } from "./controller/EditingController";
import type { EditingStep } from "../../model/EditingStep";
import type { EditingState } from "../../model/EditingState";

export function useEditing({
    map,
    editingStep,
    setEditingStep,
    snappingSources,
    ...interactionOptions
}: EditingOptions): EditingState {
    const mapModel = useMapModelValue({ map });
    const controller = useEditingController(mapModel);

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
                    drawOptions: editingStep.template.drawOptions ?? {},
                    completionHandler(feature, drawOlLayer) {
                        const template = editingStep.template;
                        feature.setProperties(template.prototype ?? {});
                        setEditingStep({ id: "create-modify", feature, template, drawOlLayer });
                    }
                });
                break;

            case "update-select":
                controller.startSelectingFeature({
                    layers: editingStep.olLayers,
                    completionHandler(feature, olLayer) {
                        setEditingStep({ id: "update-modify", feature, olLayer });
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

    return controller.editingState;
}

function useEditingController(mapModel: MapModel): EditingController {
    return useMemo(() => new EditingController(mapModel), [mapModel]);
}

export interface EditingOptions extends MapModelProps, InteractionOptions {
    readonly editingStep: EditingStep;
    readonly setEditingStep: (newEditingStep: EditingStep) => void;
    readonly snappingSources?: VectorSource[];
}

export type { InteractionOptions };
