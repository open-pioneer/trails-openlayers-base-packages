// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AnyLayer, isSublayer, Layer, LayerLoadState, MapModel } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

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
 * The layer load state.
 *
 * For sublayers this combines the parent layer's load state (e.g. a failed source or
 * capabilities request affects all sublayers) with the sublayer's own state.
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
