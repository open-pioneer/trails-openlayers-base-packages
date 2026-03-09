// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { isLayer, type Layer, type MapModel } from "@open-pioneer/map";
import { Vector as VectorLayer } from "ol/layer";
import type { Vector as VectorSource } from "ol/source";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Action } from "../components/action-selector/ActionSelector";
import type {
    DrawingStep,
    EditingStep,
    InitialStep,
    SelectionStep
} from "../../api/model/EditingStep";
import type { FeatureTemplate } from "../../api/model/FeatureTemplate";

type StatePair<S> = [S, (newState: S) => void];

export function useEditingStep(
    onEditingStepChange: ((newStep: EditingStep) => void) | undefined
): StatePair<EditingStep> {
    const [editingStep, setEditingStep] = useState<EditingStep>({ id: "initial" });

    useEffect(() => {
        onEditingStepChange?.(editingStep);
    }, [editingStep, onEditingStepChange]);

    return [editingStep, setEditingStep];
}

export function useOnActionChange(
    mapModel: MapModel | undefined,
    selectableLayers: Layer[] | undefined,
    templates: FeatureTemplate[],
    setEditingStep: (newEditingStep: EditingStep) => void
): (newAction: Action | undefined) => void {
    const defaultLayers = useDefaultLayers(mapModel, templates);

    return useCallback(
        (action) => {
            if (action == null) {
                setEditingStep({ id: "initial" } satisfies InitialStep);
            } else if (action.mode === "update") {
                setEditingStep({
                    id: "selection",
                    layers: selectableLayers ?? defaultLayers
                } satisfies SelectionStep);
            } else {
                setEditingStep({ id: "drawing", template: action.template } satisfies DrawingStep);
            }
        },
        [defaultLayers, selectableLayers, setEditingStep]
    );
}

export function useSnappingSources(
    mapModel: MapModel | undefined,
    snappableLayers: Layer[] | undefined,
    templates: FeatureTemplate[]
): VectorSource[] {
    const defaultLayers = useDefaultLayers(mapModel, templates);

    return useMemo(() => {
        return compactMap(snappableLayers ?? defaultLayers, (layer) =>
            layer.olLayer instanceof VectorLayer ? layer.olLayer.getSource() : undefined
        );
    }, [defaultLayers, snappableLayers]);
}

function useDefaultLayers(mapModel: MapModel | undefined, templates: FeatureTemplate[]): Layer[] {
    return useReactiveSnapshot(() => {
        const layerIds = compactMap(templates, ({ layerId }) => layerId);
        const uniqueLayerIds = new Set(layerIds);
        const layers = compactMap([...uniqueLayerIds], (id) => mapModel?.layers.getLayerById(id));
        return layers.filter((layer) => isLayer(layer));
    }, [mapModel, templates]);
}

function compactMap<T, U>(array: T[], mapper: (element: T) => U | undefined): U[] {
    return array.flatMap((element) => {
        const value = mapper(element);
        return value != null ? [value] : [];
    });
}
