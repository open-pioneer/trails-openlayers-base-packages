// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { HighlightOptions, MapModel } from "@open-pioneer/map";
import type { Vector as VectorSource } from "ol/source";
import { useEffect, useMemo } from "react";

import { startDrawingFeature } from "./drawing";
import { startSelectingFeature, type SelectOptions } from "./selection";
import { startModifyingFeature, type ModifyOptions } from "./modification";
import type { SnapOptions } from "./snapping";

import {
    useEditingActions,
    type EditingActions,
    type EditingCapabilities
} from "../actions/useEditingActions";
import type { EditingStep } from "../../model/EditingStep";
import type { ValueSetter } from "../../types/types";

export function useEditing({
    mapModel,
    editingStep,
    setEditingStep,
    snappingSources = [],
    ...interactionOptions
}: EditingOptions): Editing {
    const { actions, capabilities, tracker, actionHandler } = useEditingActions();

    const {
        selectOptions,
        modifyOptions,
        snapOptions,
        highlightNewFeatures = true,
        highlightExistingFeatures = true,
        highlightOptions
    } = interactionOptions;

    useEffect(() => {
        if (mapModel != null) {
            switch (editingStep.id) {
                case "none":
                    return undefined;

                case "create-draw":
                    return startDrawingFeature({
                        map: mapModel.olMap,
                        geometryType: editingStep.template.geometryType,
                        drawOptions: editingStep.template.drawOptions,
                        actions,
                        tracker,
                        actionHandler,
                        snappingSources,
                        snapOptions,
                        completionHandler(feature, drawLayer) {
                            const template = editingStep.template;
                            feature.setProperties(template.prototype ?? {});
                            setEditingStep({
                                id: "create-modify",
                                feature,
                                template,
                                drawOlLayer: drawLayer
                            });
                        }
                    });

                case "update-select":
                    return startSelectingFeature({
                        map: mapModel.olMap,
                        layers: editingStep.olLayers,
                        selectOptions,
                        completionHandler(feature, layer) {
                            setEditingStep({ id: "update-modify", feature, olLayer: layer });
                        }
                    });

                case "create-modify":
                    return startModifyingFeature({
                        mapModel,
                        feature: editingStep.feature,
                        drawLayer: editingStep.drawOlLayer,
                        snappingSources,
                        snapOptions,
                        modifyOptions,
                        highlightFeature: highlightNewFeatures,
                        highlightOptions
                    });

                case "update-modify":
                    return startModifyingFeature({
                        mapModel,
                        feature: editingStep.feature,
                        snappingSources,
                        snapOptions,
                        modifyOptions,
                        highlightFeature: highlightExistingFeatures,
                        highlightOptions
                    });
            }
        } else {
            return undefined;
        }
    }, [
        actionHandler,
        actions,
        editingStep,
        highlightExistingFeatures,
        highlightNewFeatures,
        highlightOptions,
        mapModel,
        modifyOptions,
        selectOptions,
        setEditingStep,
        snapOptions,
        snappingSources,
        tracker
    ]);

    return useMemo(() => ({ actions, capabilities }), [actions, capabilities]);
}

export interface EditingOptions extends InteractionOptions {
    readonly mapModel: MapModel | undefined;
    readonly editingStep: EditingStep;
    readonly setEditingStep: ValueSetter<EditingStep>;
    readonly snappingSources?: VectorSource[];
}

export interface InteractionOptions {
    readonly selectOptions?: SelectOptions;
    readonly modifyOptions?: ModifyOptions;
    readonly snapOptions?: SnapOptions;

    readonly highlightNewFeatures?: boolean;
    readonly highlightExistingFeatures?: boolean;
    readonly highlightOptions?: HighlightOptions;
}

export interface Editing {
    readonly actions: EditingActions;
    readonly capabilities: EditingCapabilities;
}

export type { SelectOptions, ModifyOptions, SnapOptions };
