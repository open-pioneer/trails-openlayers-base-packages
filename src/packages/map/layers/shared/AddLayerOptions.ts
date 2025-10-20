// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer } from "../unions";

/**
 * These options can be used to insert a new layer at a specific location in the top level hierarchy.
 *
 * @group Layer Utilities
 **/
export type AddLayerOptions = AddLayerOptionsTopBottom | AddLayerOptionsAboveBelow;

/**
 * @group Layer Utilities
 */
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

/**
 * @group Layer Utilities
 */
export interface AddLayerOptionsTopBottom extends AddLayerOptionsBase {
    at: "top" | "bottom" | "topmost";
}

/**
 * @group Layer Utilities
 */
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
