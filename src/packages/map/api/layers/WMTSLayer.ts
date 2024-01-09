// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer, LayerConfig } from "./base";
import { WMTSLayerImpl } from "../../model/layers/WMTSLayerImpl";
export interface WMTSLayerConfig extends LayerConfig {
    /** URL of the WMTS service. */
    url: string;

    /** The name of the WMTS layer in the service's capabilities. */
    name: string;

    /** The name of the tile matrix set in the service's capabilities. */
    matrixSet: string;

    /**Optional license note or source references*/
    attributions?: string;
}
export interface WMTSLayer extends Layer {
    /** URL of the WMTS service. */
    readonly url: string;

    /** The name of the WMTS layer in the service's capabilities. */
    readonly name: string;

    /** The name of the tile matrix set in the service's capabilities. */
    readonly matrixSet: string;

    /**Optional license note or source references*/
    readonly attributions?: string;
}
export interface WMTSLayerConstructor {
    prototype: WMTSLayer;

    /** Creates a new {@link WMTSLayer}. */
    new (config: WMTSLayerConfig): WMTSLayer;
}

export const WMTSLayer: WMTSLayerConstructor = WMTSLayerImpl;
