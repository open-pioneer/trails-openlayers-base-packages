// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { Options as WMSSourceOptions } from "ol/source/ImageWMS";
import { WMSLayerImpl } from "../../model/layers/WMSLayerImpl";
import type { LayerBaseConfig, Layer, SublayersCollection } from "./base";

/**
 * Configuration options to construct a WMS layer.
 */
export interface WMSLayerConfig extends LayerBaseConfig {
    /** URL of the WMS service. */
    url: string;

    /** Configures the layer's sublayers. */
    sublayers?: WMSSublayerConfig[];

    /**
     * Additional source options for the layer's WMS source.
     *
     * NOTE: These options are intended for advanced configuration:
     * the WMS Layer manages some of the open layers source options itself.
     */
    sourceOptions?: Partial<WMSSourceOptions>;
}

/**
 * Configuration options to construct the sublayers of a WMS layer.
 */
export interface WMSSublayerConfig extends LayerBaseConfig {
    /** The name of the WMS sublayer in the service's capabilities. */
    name: string;

    /** Configuration for nested sublayers. */
    sublayers?: WMSSublayerConfig[];
}

/** Represents a WMS layer. */
export interface WMSLayer extends Layer {
    readonly sublayers: SublayersCollection;

    /** The URL of the WMS service that was used during layer construction. */
    readonly url: string;
}

/**
 * Constructor for {@link WMSLayer}.
 */
export interface WMSLayerConstructor {
    prototype: WMSLayer;

    /** Creates a new {@link WMSLayer}. */
    new (config: WMSLayerConfig): WMSLayer;
}

export const WMSLayer: WMSLayerConstructor = WMSLayerImpl;
