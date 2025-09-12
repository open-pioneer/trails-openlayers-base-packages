// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { deprecated } from "@open-pioneer/core";
import { Group } from "ol/layer";
import { MapModelImpl } from "../model/MapModelImpl";
import { getRecursiveLayers } from "../model/getRecursiveLayers";
import { LayerRetrievalOptions, RecursiveRetrievalOptions } from "../shared";
import { AbstractLayer } from "./AbstractLayer";
import { AnyLayer, ChildrenCollection, Layer, LayerConfig } from "./base";
import { InternalConstructorTag, LayerConstructor, LayerDependencies } from "./internals";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "../LayerFactory";

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

const deprecatedConstructor = deprecated({
    name: "GroupLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0",
    alternative: "use LayerFactory.create() instead"
});

/**
 * Represents a group of layers.
 *
 * A group layer contains a collection of {@link Layer} children.
 * Groups can be nested to form a hierarchy.
 */
export class GroupLayer extends AbstractLayer {
    #children: GroupLayerCollection;

    /**
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    constructor(config: GroupLayerConfig);

    /**
     * NOTE: Do not use this overload. Use {@link LayerFactory.create} instead.
     *
     * @internal
     */
    constructor(
        config: GroupLayerConfig,
        deps: LayerDependencies,
        internalTag: InternalConstructorTag
    );

    constructor(
        config: GroupLayerConfig,
        deps?: LayerDependencies,
        internalTag?: InternalConstructorTag
    ) {
        if (!internalTag) {
            deprecatedConstructor();
        }

        const groupLayers = config.layers;
        const olGroup = new Group({ layers: groupLayers.map((sublayer) => sublayer.olLayer) });
        super({ ...config, olLayer: olGroup }, deps, internalTag);
        this.#children = new GroupLayerCollection(groupLayers, this);
    }

    override get type() {
        return "group" as const;
    }

    override get legend() {
        return undefined;
    }

    /**
     * Layers contained in this group.
     */
    override get layers(): GroupLayerCollection {
        return this.#children;
    }

    override get sublayers(): undefined {
        return undefined;
    }

    /**
     * Raw OpenLayers group instance.
     *
     * **Warning:** Do not manipulate the collection of layers in this group directly, changes are not synchronized!
     */
    override get olLayer(): Group {
        return super.olLayer as Group;
    }

    override __attachToMap(map: MapModelImpl): void {
        super.__attachToMap(map);
        this.layers.__getRawLayers().forEach((layer) => layer.__attachToMap(map));
    }

    override __detachFromMap(): void {
        super.__detachFromMap();
        this.layers.__getRawLayers().forEach((layer) => layer.__detachFromMap());
    }
}

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<GroupLayerConfig, GroupLayer> = GroupLayer;
    void check;
}

/**
 * Contains {@link Layer} instances that belong to a {@link GroupLayer}
 */
// NOTE: adding / removing  currently not supported.
// When adding support for dynamic content, make sure to also updating the layer indexing logic in the map (LayerCollectionImpl).
// Nested children of a group layer must also be found in id-lookups.
export class GroupLayerCollection implements ChildrenCollection<Layer> {
    #layers: (AbstractLayer & Layer)[];
    #parent: GroupLayer;

    constructor(layers: Layer[], parent: GroupLayer) {
        layers = layers.slice(); // Don't modify the input
        for (const layer of layers) {
            if (layer.isBaseLayer) {
                throw new Error(
                    `Layer '${layer.id}' of group '${parent.id}' is marked as base layer. Layers that belong to a group layer cannot be a base layer.`
                );
            }
            layer.__attachToGroup(parent); //attach every layer to the parent group layer
        }
        this.#layers = layers as (Layer & AbstractLayer)[];
        this.#parent = parent;
    }

    /**
     * Destroys this collection, all contained layers are detached from their parent group layer
     */
    destroy() {
        for (const layer of this.#layers) {
            layer.__detachFromGroup();
            layer.destroy();
        }
        this.#layers = [];
    }

    // Generic method name for consistent interface
    getItems(options?: LayerRetrievalOptions): (AbstractLayer & Layer)[] {
        return this.getLayers(options);
    }

    /**
     * Returns all layers in this collection
     */
    getLayers(_options?: LayerRetrievalOptions | undefined): (AbstractLayer & Layer)[] {
        // NOTE: options are ignored because layers are always ordered at this time.
        return this.#layers.slice();
    }

    /**
     * Returns a list of all layers in the collection, including all children (recursively).
     *
     * > Note: This includes base layers by default (see `options.filter`).
     * > Use the `"base"` or `"operational"` short hand values to filter by base layer or operational layers.
     * >
     * > If the group contains many, deeply nested sub groups, this function could potentially be expensive.
     */
    getRecursiveLayers(options?: RecursiveRetrievalOptions): AnyLayer[] {
        return getRecursiveLayers({
            from: this,
            sortByDisplayOrder: options?.sortByDisplayOrder,
            filter: options?.filter
        });
    }

    /**
     * Returns a reference to the internal group layer array.
     *
     * NOTE: Do not modify directly!
     */
    __getRawLayers(): (AbstractLayer & Layer)[] {
        return this.#layers;
    }

    /**
     * Returns the parent group layer that owns this collection.
     */
    __getParent(): GroupLayer {
        return this.#parent;
    }
}
