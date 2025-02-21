// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type OlBaseLayer from "ol/layer/Base";
import { LayerConfig, LayerBaseType } from "./base";
import { SimpleLayerImpl } from "../../model/layers/SimpleLayerImpl";

/**
 * Options to construct a simple layer.
 *
 * Simple layers are wrappers around a custom OpenLayers layer.
 */
export interface SimpleLayerConfig extends LayerConfig {
    /**
     * The raw OpenLayers instance.
     */
    olLayer: OlBaseLayer;
}

/** Constructor for {@link SimpleLayer}. */
export interface SimpleLayerConstructor {
    prototype: SimpleLayer;

    /** Creates a new {@link SimpleLayer}. */
    new (config: SimpleLayerConfig): SimpleLayer;
}

/**
 * A simple layer type wrapping an OpenLayers layer.
 */
export interface SimpleLayer extends LayerBaseType {
    readonly type: "simple";

    readonly layers: undefined;
}

export const SimpleLayer: SimpleLayerConstructor = SimpleLayerImpl;
