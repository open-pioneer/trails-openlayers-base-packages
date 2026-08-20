// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createLogger } from "@open-pioneer/core";
import { isLayer, type Layer, type MapModel } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Vector as VectorLayer } from "ol/layer";
import type { Vector as VectorSource } from "ol/source";
import { useIntl } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    DrawingStep,
    EditingStep,
    InitialStep,
    SelectionStep
} from "../../api/model/EditingStep";
import type { FeatureTemplate } from "../../api/model/FeatureTemplate";
import type { Action } from "../components/action-selector/ActionSelector";

const LOG = createLogger(sourceId);

type StatePair<S> = [S, (newState: S) => void];

// TODO(refactor): The logic in this file would really profit from a shared (reactive) model.
// It would make it easier to understand, but would also improve the performance.
// For example, the `defaultLayers` are evaluated multiple times (each call site),
// but always resolve to the same values.

export function useEditingStep(
    onEditingStepChange: ((newStep: EditingStep) => void) | undefined
): StatePair<EditingStep> {
    const [editingStep, setEditingStep] = useState<EditingStep>({ id: "initial" });

    useEffect(() => {
        LOG.debug("Editing step changed to", editingStep);
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

export type SelectionAvailability = SelectionAvailable | SelectionUnavailable;

export interface SelectionAvailable {
    status: "available";
}

export interface SelectionUnavailable {
    status: "unavailable";
    reason?: string;
}

/**
 * Evaluates whether the 'select' interaction should be available in the user interface.
 */
export function useSelectionAvailability(
    mapModel: MapModel,
    templates: FeatureTemplate[],
    selectableLayers: Layer[] | undefined,
    customStrategy?: undefined
): SelectionAvailability {
    const intl = useIntl();
    const defaultLayers = useDefaultLayers(mapModel, templates);
    const layers = selectableLayers ?? defaultLayers;
    const isAvailable = useReactiveSnapshot(() => layers.some((layer) => layer.visible), [layers]);
    if (!isAvailable) {
        return {
            status: "unavailable",
            reason: intl.formatMessage({ id: "selection.noVisibleLayers" })
        };
    }
    return {
        status: "available"
    };
}

export function useSnappingSources(
    mapModel: MapModel | undefined,
    snappableLayers: Layer[] | undefined,
    templates: FeatureTemplate[]
): VectorSource[] {
    const defaultLayers = useDefaultLayers(mapModel, templates);

    return useMemo(() => {
        return filterMap(snappableLayers ?? defaultLayers, (layer) =>
            layer.olLayer instanceof VectorLayer ? layer.olLayer.getSource() : undefined
        );
    }, [defaultLayers, snappableLayers]);
}

function useDefaultLayers(mapModel: MapModel | undefined, templates: FeatureTemplate[]): Layer[] {
    return useReactiveSnapshot(() => {
        const layerIds = filterMap(templates, ({ layerId }) => layerId);
        const uniqueLayerIds = new Set(layerIds);
        const layers = filterMap([...uniqueLayerIds], (id) => mapModel?.layers.getLayerById(id));
        return layers.filter((layer) => isLayer(layer));
    }, [mapModel, templates]);
}

function filterMap<T, U>(array: T[], mapper: (element: T) => U | undefined): U[] {
    return array.flatMap((element) => {
        const value = mapper(element);
        return value != null ? [value] : [];
    });
}
