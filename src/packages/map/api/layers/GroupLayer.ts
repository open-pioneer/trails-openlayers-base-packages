// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Group } from "ol/layer";
import { GroupLayerImpl } from "../../model/layers/GroupLayerImpl";
import type { LayerRetrievalOptions, RecursiveRetrievalOptions } from "../shared";
import type { AnyLayer, ChildrenCollection, Layer, LayerBaseType, LayerConfig } from "./base";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "../../model/layers/LayerFactory";

/**
 * Configuration options to construct a {@link GroupLayer}.
 */
export interface GroupLayerConfig extends LayerConfig {
    /**
     * List of layers that belong to the new group layer.
     *
     * The group layer takes ownership of the given layers: they will be destroyed when the parent is destroyed.
     * A layer must have a unique parent: it can only be added to the map or a single group layer.
     */
    layers: Layer[];
}

/**
 * Represents a group of layers.
 *
 * A group layer contains a collection of {@link Layer} children.
 * Groups can be nested to form a hierarchy.
 */
export interface GroupLayer extends LayerBaseType {
    readonly type: "group";

    /**
     * Layers contained in this group.
     */
    readonly layers: GroupLayerCollection;

    /**
     * Raw OpenLayers group instance.
     *
     * **Warning:** Do not manipulate the collection of layers in this group directly, changes are not synchronized!
     */
    readonly olLayer: Group;

    readonly sublayers: undefined;
}

/**
 * Contains {@link Layer} instances that belong to a {@link GroupLayer}
 */
export interface GroupLayerCollection extends ChildrenCollection<Layer> {
    /**
     * Returns all layers in this collection
     */
    getLayers(options?: LayerRetrievalOptions): Layer[];

    /**
     * Returns a list of all layers in the collection, including all children (recursively).
     *
     * > Note: This includes base layers by default (see `options.filter`).
     * > Use the `"base"` or `"operational"` short hand values to filter by base layer or operational layers.
     * >
     * > If the group contains many, deeply nested sub groups, this function could potentially be expensive.
     */
    getRecursiveLayers(options?: RecursiveRetrievalOptions): AnyLayer[];
}

export interface GroupLayerConstructor {
    prototype: GroupLayer;

    /**
     * Creates a new {@link GroupLayer}.
     *
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    new (config: GroupLayerConfig): GroupLayer;
}

export const GroupLayer: GroupLayerConstructor = GroupLayerImpl;
