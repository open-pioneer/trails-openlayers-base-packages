// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { SimpleLayerImpl } from "../../model/layers/SimpleLayerImpl";
import { LayerConfig, LayerModel } from "../layers";
import type OlBaseLayer from "ol/layer/Base";

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

/** Constructor for {@link SimpleLayerModel}. */
export interface SimpleLayerModelConstructor {
    prototype: SimpleLayerModel;

    /** Creates a new {@link SimpleLayerModel}. */
    new (config: SimpleLayerConfig): SimpleLayerModel;
}

/**
 * A simple layer model wrapping an OpenLayers layer.
 */
export type SimpleLayerModel = LayerModel;
export const SimpleLayerModel: SimpleLayerModelConstructor = SimpleLayerImpl;
