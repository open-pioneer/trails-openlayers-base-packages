// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import { Vector as VectorLayer, Layer } from "ol/layer";
import type { Vector as VectorSource } from "ol/source";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Action } from "../../model/Action";
import type { EditingStep } from "../../model/EditingStep";
import type { Callback, StatePair, ValueSetter } from "../../types/types";

export function useEditingStep(
    onEditingStepChange: Callback<EditingStep> | undefined
): StatePair<EditingStep> {
    const [editingStep, setEditingStep] = useState<EditingStep>({ id: "none" });

    useEffect(() => {
        onEditingStepChange?.(editingStep);
    }, [editingStep, onEditingStepChange]);

    return [editingStep, setEditingStep];
}

export function useOnActionChangeCallback(
    mapModel: MapModel | undefined,
    editableLayerIds: string[],
    setEditingStep: ValueSetter<EditingStep>
): Callback<Action | undefined> {
    const editableLayers = useLayers(mapModel, editableLayerIds);

    return useCallback(
        (action) => {
            if (action == null) {
                setEditingStep({ id: "none" });
            } else if (action.type === "update") {
                setEditingStep({ id: "update-select", olLayers: editableLayers });
            } else {
                setEditingStep({ id: "create-draw", template: action.template });
            }
        },
        [editableLayers, setEditingStep]
    );
}

export function useSnappingSources(
    mapModel: MapModel | undefined,
    snappableLayerIds: string[] | undefined
): VectorSource[] {
    const layers = useLayers(mapModel, snappableLayerIds ?? []);

    return useMemo(() => {
        const vectorLayers = layers.filter((layer): layer is VectorLayer => {
            return layer instanceof VectorLayer;
        });
        return compactMap(vectorLayers, (vectorLayer) => vectorLayer.getSource());
    }, [layers]);
}

// TODO: This is not reactive (needs useReactiveSnapshot).
function useLayers(mapModel: MapModel | undefined, editableLayerIds: string[]): Layer[] {
    return useMemo(() => {
        return compactMap(editableLayerIds, (id) => {
            const layer = mapModel?.layers.getLayerById(id);
            if (layer?.type === "simple" && layer.olLayer instanceof Layer) {
                return layer.olLayer;
            } else {
                return null;
            }
        });
    }, [editableLayerIds, mapModel]);
}

function compactMap<T, U>(array: T[], mapper: (element: T) => U | null): U[] {
    return array.flatMap((element) => {
        const value = mapper(element);
        return value != null ? [value] : [];
    });
}
