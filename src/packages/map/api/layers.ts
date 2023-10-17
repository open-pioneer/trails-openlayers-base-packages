// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import type { EventSource } from "@open-pioneer/core";
import type OlBaseLayer from "ol/layer/Base";
import type { MapModel } from "./MapModel";
import type { LayerRetrievalOptions } from "./shared";

/** Events emitted by the {@link LayerModel} and other layer types. */
export interface LayerModelBaseEvents {
    "changed": void;
    "changed:title": void;
    "changed:description": void;
    "changed:visible": void;
    "changed:attributes": void;
    "changed:loadState": void;
    "destroy": void;
}

/** The load state of a layer. */
export type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/**
 * Options supported by all layer types (operational layers and sublayers).
 */
export interface LayerConfigBase {
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
     *
     * Defaults to `true`.
     */
    visible?: boolean;

    /**
     * Additional attributes for this layer.
     * These can be arbitrary values.
     */
    attributes?: Record<string | symbol, unknown>;
}

/**
 * Options supported by all operational layer types.
 */
export interface LayerConfig extends LayerConfigBase {
    /**
     * Whether this layer is a base layer or not.
     * Only one base layer can be active at a time.
     *
     * Defaults to `false`.
     */
    isBaseLayer?: boolean;
}

/**
 * Interface shared by all layer types (operational layers and sublayers).
 *
 * Instances of this interface cannot be constructed directly; use a real layer
 * class such as {@link SimpleLayerModel} instead.
 */
export interface LayerModelBase<AdditionalEvents = {}>
    extends EventSource<LayerModelBaseEvents & AdditionalEvents> {
    /** The map this layer belongs to. */
    readonly map: MapModel;

    /** The unique id of this layer (scoped to the owning map). */
    readonly id: string;

    /** The human-readable title of this layer. */
    readonly title: string;

    /** The human-readable description of this layer. May be empty. */
    readonly description: string;

    /**
     * Whether the layer is visible or not.
     *
     * NOTE: The model's visible state may do more than influence the raw OpenLayers's visibility property.
     * Future versions may completely remove invisible layers from the OpenLayer's map under some circumstances.
     */
    readonly visible: boolean;

    /**
     * The collection of child sublayers for this layer.
     *
     * Layers that can never have any sublayers may not have a `sublayers` collection.
     */
    readonly sublayers: SublayersCollection | undefined;

    /**
     * Additional attributes associated with this layer.
     */
    readonly attributes: Readonly<Record<string | symbol, unknown>>;

    /**
     * Updates the title of this layer.
     */
    setTitle(newTitle: string): void;

    /**
     * Updates the description of this layer.
     */
    setDescription(newDescription: string): void;

    /**
     * Updates the visibility of this layer to the new value.
     *
     * NOTE: The visibility of base layers cannot be changed through this method.
     * Call {@link LayerCollection.activateBaseLayer} instead.
     */
    setVisible(newVisibility: boolean): void;

    /**
     * Updates the attributes of this layer.
     * Values in `newAttributes` are merged into the existing ones (i.e. via `Object.assign`).
     */
    updateAttributes(newAttributes: Record<string | symbol, unknown>): void;

    /**
     * Deletes the attribute of this layer.
     */
    deleteAttribute(deleteAttribute: string | symbol): void;
}

/**
 * Represents an operational layer in the map.
 *
 * Instances of this interface cannot be constructed directly; use a real layer
 * class such as {@link SimpleLayerModel} instead.
 */
export interface LayerModel<AdditionalEvents = {}> extends LayerModelBase<AdditionalEvents> {
    /**
     * Whether the layer has been loaded, or whether an error occurred while trying to load it.
     */
    readonly loadState: LayerLoadState;

    /**
     * The raw OpenLayers layer.
     */
    readonly olLayer: OlBaseLayer;

    /**
     * True if this layer is a base layer.
     *
     * Only one base layer can be visible at a time.
     */
    readonly isBaseLayer: boolean;
}

/**
 * Represents a sublayer of another layer.
 */
export interface SublayerModel extends LayerModelBase {
    /**
     * The direct parent of this layer model.
     * This can either be the parent layer or another sublayer.
     */
    readonly parent: LayerModel | SublayerModel;

    /**
     * The parent layer that owns this sublayer.
     */
    readonly parentLayer: LayerModel;
}

/**
 * Events emitted by the {@link SublayersCollection}.
 */
export interface SublayersCollectionEvents {
    changed: void;
}

/**
 * Contains the sublayers that belong to a {@link LayerModel} or {@link SublayerModel}.
 */
export interface SublayersCollection extends EventSource<SublayersCollectionEvents> {
    /**
     * Returns the child sublayers in this collection.
     */
    getSublayers(options?: LayerRetrievalOptions): SublayerModel[];
}

export * from "./layers/SimpleLayer";
export * from "./layers/WMSLayer";
