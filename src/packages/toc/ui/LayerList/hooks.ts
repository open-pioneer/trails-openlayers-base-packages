// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed } from "@conterra/reactivity-core";
import { shallowEqual } from "@open-pioneer/core";
import { AnyLayer, isLayer, isSublayer, Layer, LayerLoadState, MapModel } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useMemo } from "react";

/** Returns the top level operational layers in render order (topmost layer first). */
export function useLayers(map: MapModel): Layer[] {
    return useReactiveSnapshot(() => {
        const layers =
            map.layers.getOperationalLayers({
                sortByDisplayOrder: true,
                includeInternalLayers: true //internal status is handled by LayerItems
            }) ?? [];
        layers.reverse(); // render topmost layer first
        return layers;
    }, [map]);
}

/**
 * Returns the child layers (sublayers or layers contained in a group layer) of a layer.
 * Layers are returned in render order (topmost sublayer first).
 */
export function useChildLayers(layer: AnyLayer): AnyLayer[] | undefined {
    return useReactiveSnapshot(() => {
        const children = layer.children?.getItems({
            sortByDisplayOrder: true,
            includeInternalLayers: true //internal status is handled by LayerItems
        });
        children?.reverse(); // render topmost layer first
        return children;
    }, [layer]);
}

export function useLoadState(layer: AnyLayer): LayerLoadState {
    return useReactiveSnapshot(() => ownLoadState(layer), [layer]);
}

/** Returns the layers current visibility. */
export function useVisibleInScale(layer: AnyLayer): boolean {
    return useReactiveSnapshot(() => {
        // for sublayers, use the state of the parent
        const target = isSublayer(layer) ? layer.parentLayer : layer;

        return target.visibleInScale;
    }, [layer]);
}

/**
 * Returns the combined errors of all descendants
 * or `undefined` if no descendant is in an error state.
 */
export function useSublayerError(layer: AnyLayer): AggregateError | undefined {
    const sublayerError = useMemo(
        () =>
            computed(() => (isLayer(layer) ? collectSublayerError(layer) : undefined), {
                equal: sublayerErrorsEqual
            }),
        [layer]
    );
    return useReactiveSnapshot(() => sublayerError.value, [sublayerError]);
}

function collectSublayerError(layer: Layer): AggregateError | undefined {
    const errors: Error[] = [];
    for (const descendant of walkDescendants(layer)) {
        const error = descendant.loadError;
        if (error) {
            errors.push(error);
        }
    }
    if (errors.length === 0) {
        return undefined;
    }
    return new AggregateError(
        errors,
        `Layer '${layer.id}' has ${errors.length} sublayer(s) in error state`
    );
}

function* walkDescendants(layer: AnyLayer): Generator<AnyLayer> {
    const children = layer.children?.getItems({ includeInternalLayers: true });
    if (!children) {
        return;
    }
    for (const child of children) {
        yield child;
        yield* walkDescendants(child);
    }
}

function sublayerErrorsEqual(
    a: AggregateError | undefined,
    b: AggregateError | undefined
): boolean {
    if (a === b) {
        return true;
    }
    if (!a || !b) {
        return false;
    }
    const aErrors = a.errors as Error[];
    const bErrors = b.errors as Error[];
    return shallowEqual(aErrors, bErrors);
}

/**
 * The layer load state.
 *
 * Sublayer combines the parent layer's load state with their own state.
 */
function ownLoadState(layer: AnyLayer): LayerLoadState {
    if (isSublayer(layer)) {
        return worseState(layer.parentLayer.loadState, layer.loadState);
    }
    return layer.loadState;
}

const STATE_SEVERITY: Record<LayerLoadState, number> = {
    loaded: 0,
    "not-loaded": 1,
    loading: 2,
    error: 3
};

/** Returns the worse (higher severity) of two load states: error > loading > not-loaded > loaded. */
function worseState(a: LayerLoadState, b: LayerLoadState): LayerLoadState {
    return STATE_SEVERITY[a] >= STATE_SEVERITY[b] ? a : b;
}
