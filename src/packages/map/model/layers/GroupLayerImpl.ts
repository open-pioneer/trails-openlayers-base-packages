// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { deprecated } from "@open-pioneer/core";
import { Group } from "ol/layer";
import {
    AnyLayer,
    GroupLayerCollection,
    Layer,
    LayerRetrievalOptions,
    RecursiveRetrievalOptions
} from "../../api";
import { GroupLayer, GroupLayerConfig } from "../../api/layers/GroupLayer";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { getRecursiveLayers } from "../getRecursiveLayers";
import { InternalConstructorTag, LayerConstructor, LayerDependencies } from "./internals";

// Import for api docs
// eslint-disable-next-line unused-imports/no-unused-imports
import type { LayerFactory } from "./LayerFactory";

const deprecatedConstructor = deprecated({
    name: "GroupLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0"
});

export class GroupLayerImpl extends AbstractLayer implements GroupLayer {
    #children: GroupLayerCollectionImpl;

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
        this.#children = new GroupLayerCollectionImpl(groupLayers, this);
    }

    get type() {
        return "group" as const;
    }

    get legend() {
        return undefined;
    }

    get layers(): GroupLayerCollectionImpl {
        return this.#children;
    }

    get sublayers(): undefined {
        return undefined;
    }

    /**
     * return raw OL LayerGroup
     * Warning: Do not manipulate the collection of layers in this group, changes are not synchronized!
     */
    get olLayer(): Group {
        return super.olLayer as Group;
    }

    __attachToMap(map: MapModelImpl): void {
        super.__attachToMap(map);
        this.layers.__getRawLayers().forEach((layer) => layer.__attachToMap(map));
    }

    __detachFromMap(): void {
        super.__detachFromMap();
        this.layers.__getRawLayers().forEach((layer) => layer.__detachFromMap());
    }
}

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<GroupLayerConfig, GroupLayer> = GroupLayerImpl;
    void check;
}

// NOTE: adding / removing  currently not supported.
// When adding support for dynamic content, make sure to also updating the layer indexing logic in the map (LayerCollectionImpl).
// Nested children of a group layer must also be found in id-lookups.
export class GroupLayerCollectionImpl implements GroupLayerCollection {
    #layers: (AbstractLayer & Layer)[];
    #parent: GroupLayer;

    constructor(layers: Layer[], parent: GroupLayer) {
        layers = layers.slice(); // Don't modify the input
        for (const layer of layers) {
            if (layer instanceof AbstractLayer) {
                if (layer.isBaseLayer) {
                    throw new Error(
                        `Layer '${layer.id}' of group '${parent.id}' is marked as base layer. Layers that belong to a group layer cannot be a base layer.`
                    );
                }
                layer.__attachToGroup(parent); //attach every layer to the parent group layer
            } else {
                throw new Error(
                    `Layer '${layer.id}' of group '${parent.id}' does not implement abstract class '${AbstractLayerBase.name}`
                );
            }
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

    getLayers(_options?: LayerRetrievalOptions | undefined): (AbstractLayer & Layer)[] {
        // NOTE: options are ignored because layers are always ordered at this time.
        return this.#layers.slice();
    }

    getRecursiveLayers(_options?: RecursiveRetrievalOptions): AnyLayer[] {
        return getRecursiveLayers({
            from: this,
            sortByDisplayOrder: _options?.sortByDisplayOrder,
            filter: _options?.filter
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
