// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AnyLayer, isSublayer, Layer, MapModel } from "@open-pioneer/map";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/**
 * Information about an aggregated error: which descendant produced it.
 */
export interface AggregatedLayerError {
    error: Error;
    /** The (top-level or descendant) layer that exposes the error. */
    source: Layer;
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

/** Returns the layers current state. */
export function useLoadState(layer: AnyLayer): string {
    return useReactiveSnapshot(() => {
        // for sublayers, use the state of the parent
        const target = isSublayer(layer) ? layer.parentLayer : layer;
        return target.loadState;
    }, [layer]);
}

/**
 * Returns the load state of the layer. For group layers this aggregates the
 * worst load state of all descendant layers (so a group reflects errors of
 * its children).
 */
export function useAggregatedLoadState(layer: AnyLayer): LayerLoadState {
    return useReactiveSnapshot(() => {
        const target = isSublayer(layer) ? layer.parentLayer : layer;
        if (target.type !== "group") {
            return target.loadState as LayerLoadState;
        }
        return combine(target);
    }, [layer]);
}

/**
 * Returns the first error found on the layer or — for groups — on any
 * descendant layer. Also reports which layer produced the error.
 */
export function useAggregatedError(layer: AnyLayer): AggregatedLayerError | undefined {
    return useReactiveSnapshot(() => {
        const target = isSublayer(layer) ? layer.parentLayer : layer;
        if (target.error) {
            return { error: target.error, source: target };
        }
        if (target.type === "group") {
            for (const descendant of walkGroupDescendants(target)) {
                if (descendant.error) {
                    return { error: descendant.error, source: descendant };
                }
            }
        }
        return undefined;
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

/** Yields all descendant layers of a group layer (recursive, excluding the group itself). */
function* walkGroupDescendants(group: Layer): Generator<Layer> {
    if (group.type !== "group" || !group.layers) {
        return;
    }
    const children = group.layers.getItems({ includeInternalLayers: true });
    for (const child of children) {
        yield child;
        if (child.type === "group") {
            yield* walkGroupDescendants(child);
        }
    }
}

/** Combines own load state with descendants (worst-of). */
function combine(group: Layer): LayerLoadState {
    let worst: LayerLoadState = group.loadState as LayerLoadState;
    for (const descendant of walkGroupDescendants(group)) {
        const state = descendant.loadState as LayerLoadState;
        if (state === "error") {
            return "error";
        }
        if (state === "loading" && worst !== "error") {
            worst = "loading";
        } else if (state === "not-loaded" && worst === "loaded") {
            worst = "not-loaded";
        }
    }
    return worst;
}
