// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AnyLayer, Layer } from "./layers/unions";

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

/** These options can be used to insert a new layer at a specific location in the top level hierarchy. */
export type AddLayerOptions = AddLayerOptionsTopBottom | AddLayerOptionsAboveBelow;

export interface AddLayerOptionsBase {
    /**
     * Where to insert the new layer.
     *
     * Default: "top"
     *
     * - "top": Insert the new layer _above_ all other *normal* operational layers (note: still below `"topmost"` layers).
     * - "bottom": Insert the new layer _below_ all other operational layers.
     * - "above": Insert the new layer _above_ the specified `reference` layer.
     * - "below": Insert the new layer _below_ the specified `reference` layer.
     * - "topmost": Insert a new layer that is always displayed on top of all layers that were added at `top` (e.g. a highlight layer).
     */
    at: "top" | "bottom" | "above" | "below" | "topmost";
}

export interface AddLayerOptionsTopBottom extends AddLayerOptionsBase {
    at: "top" | "bottom" | "topmost";
}

export interface AddLayerOptionsAboveBelow extends AddLayerOptionsBase {
    at: "above" | "below";

    /**
     * The layer that serves as a reference point for insertion.
     *
     * Can be specified either as a layer object or an `id`.
     *
     * The reference must be a top level operational layer in the layer collection.
     * Otherwise an error will be thrown.
     */
    reference: Layer | string;
}
