// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AnyLayer, ChildrenCollection } from "../api";

export interface RecursiveLayerOptions<LayerType> {
    /**
     * Starting point(s) of the recursion.
     * The layers in this collections and their all of their children (recursively) will be included in the result.
     */
    from: ChildrenCollection<LayerType>;

    /**
     * Optional filter function to determine whether a layer should be included in the result.
     * Return `false` to exclude a layer (and all its children) from the result.
     */
    filter?: (layer: AnyLayer) => boolean;

    /**
     * If set to `true`, layers will be ordered by their display order:
     * Layers listed first in the returned array are shown _below_ layers listed at a later index.
     *
     * By default, layers are returned in arbitrary order.
     */
    sortByDisplayOrder?: boolean;
}

export function getRecursiveLayers<LayerType extends AnyLayer>(
    options: RecursiveLayerOptions<LayerType>
): AnyLayer[] {
    const filter = options.filter ?? (() => true);
    const sortByDisplayOrder = options.sortByDisplayOrder ?? false;

    const layers = options.from.getItems({ sortByDisplayOrder });

    const result: AnyLayer[] = [];
    for (const layer of layers) {
        if (!filter(layer)) {
            continue;
        }

        const children = layer.children;
        if (children) {
            const recursiveChildren = getRecursiveLayers({
                from: children,
                filter,
                sortByDisplayOrder
            });
            result.push(...recursiveChildren);
        }
        result.push(layer);
    }
    return result;
}
