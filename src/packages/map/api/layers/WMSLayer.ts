// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { Options as WMSSourceOptions } from "ol/source/ImageWMS";
import { WMSLayerImpl } from "../../model/layers/WMSLayerImpl";
import type { LayerConfigBase, LayerModel, SublayersCollection } from "../layers";

/**
 * Options to construct a WMS layer.
 */
export interface WMSLayerConfig extends LayerConfigBase {
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
 * Options to construct the sublayers of a WMS layer.
 */
export interface WMSSublayerConfig extends LayerConfigBase {
    /** The name of the WMS sublayer in the service's capabilities. */
    name: string;

    /** Configuration for nested sublayers. */
    sublayers?: WMSSublayerConfig[];
}

/** Represents a WMS layer. */
export interface WMSLayerModel extends LayerModel {
    readonly sublayers: SublayersCollection;
}

/**
 * Constructor for {@link WMSLayerModel}.
 */
export interface WMSLayerModelConstructor {
    prototype: WMSLayerModel;

    /** Creates a new {@link WMSLayerModel}. */
    new (config: WMSLayerConfig): WMSLayerModel;
}

export const WMSLayerModel: WMSLayerModelConstructor = WMSLayerImpl;
