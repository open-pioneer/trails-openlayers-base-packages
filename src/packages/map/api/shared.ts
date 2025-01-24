// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { AnyLayer } from "./layers";

/** These options can be used by some APIs returning an array of layers (or sublayers). */
export interface LayerRetrievalOptions {
    /**
     * If set to `true`, layers will be ordered by their display order:
     * Layers listed first in the returned array are shown _below_ layers listed at a later index.
     *
     * By default, layers are returned in arbitrary order.
     */
    sortByDisplayOrder?: boolean;
}

/** These options can be used when recursively retrieving layers from a collection. */
export interface RecursiveRetrievalOptions extends LayerRetrievalOptions {
    /**
     * Optional filter function to determine whether a layer should be included in the result.
     * Return `false` to exclude a layer (and all its children) from the result.
     */
    filter?: (layer: AnyLayer) => boolean;
}
