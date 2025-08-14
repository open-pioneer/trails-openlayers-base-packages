// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type OlBaseLayer from "ol/layer/Base";
import { LayerConfig, LayerBaseType } from "./base";
import { SimpleLayerImpl } from "../../model/layers/SimpleLayerImpl";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "../../model/layers/LayerFactory";

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

    /**
     * Creates a new {@link SimpleLayer}.
     *
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
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
