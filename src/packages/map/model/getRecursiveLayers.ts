// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChildrenCollection } from "../layers/shared/base";
import { AnyLayer } from "../layers/unions";
import { RecursiveRetrievalOptions } from "../shared";

export interface RecursiveLayerOptions<LayerType> extends RecursiveRetrievalOptions {
    /**
     * Starting point(s) of the recursion.
     * The layers in this collections and their all of their children (recursively) will be included in the result.
     */
    from: ChildrenCollection<LayerType>;

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
    const result: AnyLayer[] = [];
    gatherRecursiveLayers(options.from, filter, sortByDisplayOrder, result);
    return result;
}

// Walks the layer tree recursively and gathers matching layers into the result array.
function gatherRecursiveLayers<LayerType extends AnyLayer>(
    from: ChildrenCollection<LayerType>,
    filter: (layer: AnyLayer) => boolean,
    sortByDisplayOrder: boolean,
    result: AnyLayer[]
): void {
    const layers = from.getItems({ sortByDisplayOrder });
    for (const layer of layers) {
        if (!filter(layer)) {
            continue;
        }

        const children = layer.children;
        if (children) {
            // Pushes into result as a side effect
            gatherRecursiveLayers(children, filter, sortByDisplayOrder, result);
        }
        result.push(layer);
    }
}
