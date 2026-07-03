// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AnyLayer, isSublayer, Layer, LayerLoadState, MapModel } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

/**
 * Information about an aggregated error: which descendant produced it.
 */
export interface AggregatedLayerError {
    error: Error;
    /** The (top-level or descendant) layer that exposes the error. */
    source: AnyLayer;
}

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

/** Returns the layer's own load state (the state shown directly on its TOC item). */
export function useLoadState(layer: AnyLayer): LayerLoadState {
    return useReactiveSnapshot(() => ownLoadState(layer), [layer]);
}

/**
 * Returns the load state of the layer. For layers with children (group layers or
 * layers with sublayers) this aggregates the worst load state of all descendants,
 * so a parent reflects errors of its children (e.g. a single broken WMS sublayer).
 */
export function useHasChildProblems(layer: AnyLayer): boolean {
    return useReactiveSnapshot(() => {
        let worst: LayerLoadState = "loaded";
        for (const descendant of walkDescendants(layer)) {
            worst = worseState(worst, ownLoadState(descendant));
            if (worst === "error") {
                return true;
            }
        }
        return false;
    }, [layer]);
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
 * The load state shown directly on a layer's own TOC item.
 *
 * For sublayers this combines the parent layer's load state (e.g. a failed source or
 * capabilities request affects all sublayers) with the sublayer's own state (e.g. an
 * invalid sublayer name affects only that sublayer).
 */
function ownLoadState(layer: AnyLayer): LayerLoadState {
    if (isSublayer(layer)) {
        return worseState(layer.parentLayer.loadState, layer.loadState);
    }
    return layer.loadState;
}

/** Yields all descendant layers of a layer (recursive, excluding the layer itself). */
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
