// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { getRecursiveLayers } from "../../model/getRecursiveLayers";
import { LayerRetrievalOptions, RecursiveRetrievalOptions } from "../../shared";
import { AbstractLayer } from "../AbstractLayer";
import { GroupLayer } from "../GroupLayer";
import { ChildrenCollection } from "../shared/ChildrenCollection";
import {
    ATTACH_TO_GROUP,
    DETACH_FROM_GROUP,
    GET_PARENT,
    GET_RAW_LAYERS
} from "../shared/internals";
import {
    assertInternalConstructor,
    InternalConstructorTag
} from "../../utils/InternalConstructorTag";
import { AnyLayer, Layer } from "../unions";

/**
 * Contains {@link Layer} instances that belong to a {@link GroupLayer}
 */
// NOTE: adding / removing  currently not supported.
// When adding support for dynamic content, make sure to also updating the layer indexing logic in the map (LayerCollectionImpl).
// Nested children of a group layer must also be found in id-lookups.
export class GroupLayerCollection implements ChildrenCollection<Layer> {
    #layers: Layer[];
    #parent: GroupLayer;

    /** @internal */
    constructor(layers: Layer[], parent: GroupLayer, tag: InternalConstructorTag) {
        assertInternalConstructor(tag);
        layers = layers.slice(); // Don't modify the input
        for (const layer of layers) {
            if (layer.isBaseLayer) {
                throw new Error(
                    `Layer '${layer.id}' of group '${parent.id}' is marked as base layer. Layers that belong to a group layer cannot be a base layer.`
                );
            }
            layer[ATTACH_TO_GROUP](parent); //attach every layer to the parent group layer
        }
        this.#layers = layers as (Layer & AbstractLayer)[];
        this.#parent = parent;
    }

    /**
     * Destroys this collection, all contained layers are detached from their parent group layer
     */
    destroy() {
        for (const layer of this.#layers) {
            layer[DETACH_FROM_GROUP]();
            layer.destroy();
        }
        this.#layers = [];
    }

    // Generic method name for consistent interface
    getItems(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options);
    }

    /**
     * Returns all layers in this collection
     */
    getLayers(options?: LayerRetrievalOptions | undefined): Layer[] {
        // NOTE: sort options are ignored because layers are always ordered at this time.
        let allLayers = this.#layers.slice();

        if (!options?.includeInternalLayers) {
            allLayers = allLayers.filter((l) => !l.internal);
        }

        return allLayers;
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
            includeInternalLayers: options?.includeInternalLayers,
            filter: options?.filter
        });
    }

    /**
     * Returns a reference to the internal group layer array.
     *
     * NOTE: Do not modify directly!
     *
     * @internal
     */
    [GET_RAW_LAYERS](): Layer[] {
        return this.#layers;
    }

    /**
     * Returns the parent group layer that owns this collection.
     *
     * @internal
     */
    [GET_PARENT](): GroupLayer {
        return this.#parent;
    }
}
