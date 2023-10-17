// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type OlBaseLayer from "ol/layer/Base";
import { LayerConfig, Layer } from "./base";
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
export type SimpleLayer = Layer;
export const SimpleLayer: SimpleLayerConstructor = SimpleLayerImpl;
