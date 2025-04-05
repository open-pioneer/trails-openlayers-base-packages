// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
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

/** These options can be used to insert a new layer at a specific location in the top level hierarchy */
export type AddLayerOptions =
    | AddLayerOptionsTopBottom
    | AddLayerOptionsAboveBelow
    | AddLayerOptionsIndex;

interface AddLayerOptionsBase {
    /**
     * Where to insert the new layer. default: "top"
     */
    at: "top" | "bottom" | "index" | "above" | "below";
}

interface AddLayerOptionsTopBottom extends AddLayerOptionsBase {
    at: "top" | "bottom";
}

interface AddLayerOptionsIndex extends AddLayerOptionsBase {
    at: "index";

    /**
     * The index at which to insert the new layer. Only used if `at` is "index".
     */
    index: number;
}

interface AddLayerOptionsAboveBelow extends AddLayerOptionsBase {
    at: "above" | "below";

    /**
     * The ID of the layer above or below which to insert the new layer. Only used if `at` is "above" or "below".
     */
    layerId: string;
}
