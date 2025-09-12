// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerRetrievalOptions } from "../../shared";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { AnyLayer, Layer, SublayerTypes } from "../unions";

/** Events emitted by the {@link Layer} and other layer types. */
export interface LayerBaseEvents {
    "destroy": void;
}

export type AnyLayerBaseType<AdditionalEvents = {}> = AbstractLayerBase<AdditionalEvents>;

export type LayerBaseType<AdditionalEvents = {}> = AbstractLayer<AdditionalEvents>;

/**
 * Represents a sublayer of another layer.
 */
export interface SublayerBaseType extends AnyLayerBaseType {
    /**
     * Identifies the type of this sublayer.
     */
    readonly type: SublayerTypes;

    /**
     * The direct parent of this layer instance.
     * This can either be the parent layer or another sublayer.
     */
    readonly parent: AnyLayer;

    /**
     * The parent layer that owns this sublayer.
     */
    readonly parentLayer: Layer;
}

/**
 * Contains the children of a layer.
 */
export interface ChildrenCollection<LayerType> {
    /**
     * Returns the items in this collection.
     */
    getItems(options?: LayerRetrievalOptions): LayerType[];
}
