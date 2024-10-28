// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { AbstractLayer } from "../../model/AbstractLayer";
import { AbstractLayerBase } from "../../model/AbstractLayerBase";
import { GroupLayerImpl } from "../../model/layers/GroupLayerImpl";
import { LayerBaseType, SublayersCollection, SublayerBaseType, LayerBaseConfig, LayerConfig, AnyLayerBaseType, LayerLoadState } from "./base";
import type OlBaseLayer from "ol/layer/Base";

export interface GroupLayerConfig extends LayerConfig {
    sublayers: AbstractLayer[]
}

export interface GroupLayerConstructor {
    prototype: GroupLayer;

    /** Creates a new {@link GroupLayer}. */
    new (config: GroupLayerConfig): GroupLayer;
}

export interface GroupLayer extends LayerBaseType {
    readonly type: "group";
}

export interface GroupSublayer extends SublayerBaseType{
    readonly type: "group-sublayer";
    readonly layer: AbstractLayer;
}

export const GroupLayer: GroupLayerConstructor = GroupLayerImpl;
