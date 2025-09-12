// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { LayerRetrievalOptions, RecursiveRetrievalOptions } from "../shared";
import { AbstractLayer } from "./AbstractLayer";
import { AbstractLayerBase } from "./AbstractLayerBase";
import type { GroupLayer } from "./GroupLayer";
import type { SimpleLayer } from "./SimpleLayer";
import type { WMSLayer, WMSSublayer } from "./WMSLayer";
import type { WMTSLayer } from "./WMTSLayer";

/** Events emitted by the {@link Layer} and other layer types. */
export interface LayerBaseEvents {
    "destroy": void;
}

/** The load state of a layer. */
export type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/** Custom function to check the state of a layer and returning a "loaded" or "error". */
export type HealthCheckFunction = (layer: Layer) => Promise<"loaded" | "error">;

/**
 * Configuration options supported by all layer types (layers and sublayers).
 */
export interface LayerBaseConfig {
    /**
     * The unique id of this layer.
     * Defaults to a generated id.
     */
    id?: string;

    /**
     * The human-readable title of this layer.
     */
    title: string;

    /**
     * The human-readable description of this layer.
     * Defaults to an empty string.
     */
    description?: string;

    /**
     * Whether this layer should initially be visible.
     * Defaults to `true`.
     */
    visible?: boolean;

    /**
     * Additional attributes for this layer.
     * These can be arbitrary values.
     */
    attributes?: Record<string | symbol, unknown>;

    /**
     * Layers marked as internal are not considered by any UI widget (e.g. Toc or Legend)
     * Defaults to `false`
     */
    internal?: boolean;
}

export type AnyLayerBaseType<AdditionalEvents = {}> = AbstractLayerBase<AdditionalEvents>;

/**
 * Configuration options supported by all operational layer types.
 */
export interface LayerConfig extends LayerBaseConfig {
    /**
     * Whether this layer is a base layer or not.
     * Only one base layer can be active at a time.
     *
     * Defaults to `false`.
     */
    isBaseLayer?: boolean;

    /**
     * Optional property to check the availability of the layer.
     * It is possible to provide either a URL which indicates the state of the service (2xx response meaning "ok")
     * or a {@link HealthCheckFunction} performing a custom check and returning the state.
     */
    healthCheck?: string | HealthCheckFunction;
}

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

/**
 * Contains the sublayers that belong to a {@link Layer} or {@link Sublayer}.
 */
export interface SublayersCollection<SublayerType = Sublayer>
    extends ChildrenCollection<SublayerType> {
    /**
     * Returns the child sublayers in this collection.
     */
    getSublayers(options?: LayerRetrievalOptions): SublayerType[];

    /**
     * Returns a list of all layers in the collection, including all children (recursively).
     *
     * > Note: This includes base layers by default (see `options.filter`).
     * > Use the `"base"` or `"operational"` short hand values to filter by base layer or operational layers.
     * >
     * > If the collection contains many, deeply nested sublayers, this function could potentially be expensive.
     */
    getRecursiveLayers(options?: RecursiveRetrievalOptions): Sublayer[];
}

/**
 * Union type for all layers (extending {@link LayerBaseType})
 */
export type Layer = SimpleLayer | WMSLayer | WMTSLayer | GroupLayer;
export type LayerTypes = Layer["type"];

/**
 * Union type for all sublayers (extending {@link SublayerBaseType}
 */
export type Sublayer = WMSSublayer;
export type SublayerTypes = Sublayer["type"];

/**
 * Union for all types of layers
 */
export type AnyLayer = Layer | Sublayer;
export type AnyLayerTypes = AnyLayer["type"];

/**
 * Type guard for checking if the layer is a {@link Sublayer}.
 */
export function isSublayer(layer: AnyLayer): layer is Sublayer {
    return "parentLayer" in layer;
}

/**
 * Type guard for checking if the layer is a {@link Layer} (and not a {@link Sublayer}).
 */
export function isLayer(layer: AnyLayer): layer is Layer {
    return "olLayer" in layer;
}
