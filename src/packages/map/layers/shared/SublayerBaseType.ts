// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AbstractLayerBase } from "../AbstractLayerBase";
import { AnyLayer, Layer, SublayerTypes } from "../unions";

/**
 * Represents a sublayer of another layer.
 */
export interface SublayerBaseType extends AbstractLayerBase {
    /**
     * Identifies the type of this sublayer.
     */
    readonly type: SublayerTypes;

    /**
     * The direct parent of this layer instance.
     * This can either be the parent layer or another sublayer.
     */
    readonly parent: AnyLayer;

    /**
     * The parent layer that owns this sublayer.
     */
    readonly parentLayer: Layer;
}
