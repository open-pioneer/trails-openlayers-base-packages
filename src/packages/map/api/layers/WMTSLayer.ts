// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer, LayerBaseConfig } from "./base";
import { WMTSLayerImpl } from "../../model/layers/WMTSLayerImpl";
export interface WMTSLayerConfig extends LayerBaseConfig {
    /** URL of the WMTS service. */
    url: string;

    /** The name of the WMTS layer in the service's capabilities. */
    name: string;

    matrixSet: string;

    attributions?: string;
}
export interface WMTSLayer extends Layer {
    /** URL of the WMTS service. */
    readonly url: string;

    readonly name: string;

    readonly matrixSet: string;

    readonly attributions?: string;
}
export interface WMTSLayerConstructor {
    prototype: WMTSLayer;

    /** Creates a new {@link WMTSLayer}. */
    new (config: WMTSLayerConfig): WMTSLayer;
}

export const WMTSLayer: WMTSLayerConstructor = WMTSLayerImpl;
