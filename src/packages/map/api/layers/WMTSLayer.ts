// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Options as WMSSourceOptions } from "ol/source/ImageWMS";
import { LayerBaseType, LayerConfig } from "./base";
import { WMTSLayerImpl } from "../../model/layers/WMTSLayerImpl";

export interface WMTSLayerConfig extends LayerConfig {
    /** URL of the WMTS service. */
    url: string;

    /** The name of the WMTS layer in the service's capabilities. */
    name: string;

    /** The name of the tile matrix set in the service's capabilities. */
    matrixSet: string;

    /**
     * Additional source options for the layer's WMTS source.
     *
     * NOTE: These options are intended for advanced configuration:
     * the WMTS Layer manages some of the OpenLayers source options itself.
     */
    sourceOptions?: Partial<WMSSourceOptions>;
}
export interface WMTSLayer extends LayerBaseType {
    readonly type: "wmts";

    /** URL of the WMTS service. */
    readonly url: string;

    /** The name of the WMTS layer in the service's capabilities. */
    readonly name: string;

    /** The name of the tile matrix set in the service's capabilities. */
    readonly matrixSet: string;
}

export interface WMTSLayerConstructor {
    prototype: WMTSLayer;

    /** Creates a new {@link WMTSLayer}. */
    new (config: WMTSLayerConfig): WMTSLayer;
}

export const WMTSLayer: WMTSLayerConstructor = WMTSLayerImpl;
