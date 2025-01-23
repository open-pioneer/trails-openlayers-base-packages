// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/** These options can be used by some APIs returning an array of layers (or sublayers). */
export interface LayerRetrievalOptions {
    /**
     * If set to `true`, layers will be ordered by their display order:
     * Layers listed first in the returned array are shown _below_ layers listed at a later index.
     *
     * By default, layers are returned in arbitrary order.
     */
    sortByDisplayOrder?: boolean;

    /**
     * If set to `true`, child layers of the returned layers will be included (recursively) in the result.
     * If set to `false` (the default), only the layers in this collection will be included.
     *
     * > NOTE: returning all child layers can be a costly operation if the hierarchy is deeply nested.
     *
     * > NOTE: returning all child layers may alter the return type (`AnyLayer` vs `Layer`), since sublayers may be included.
     */
    includeChildLayers?: boolean;
}
