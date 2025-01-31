// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Group } from "ol/layer";
import { AnyLayer, GroupLayerCollection, Layer, LayerRetrievalOptions } from "../../api";
import { GroupLayer, GroupLayerConfig } from "../../api/layers/GroupLayer";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { getRecursiveLayers } from "../getRecursiveLayers";

export class GroupLayerImpl extends AbstractLayer implements GroupLayer {
    #children: GroupLayerCollectionImpl;

    constructor(config: GroupLayerConfig) {
        const groupLayers = config.layers;
        const olGroup = new Group({ layers: groupLayers.map((sublayer) => sublayer.olLayer) });
        super({ ...config, olLayer: olGroup });
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

    getRecursiveLayers({
        filter,
        sortByDisplayOrder
    }: LayerRetrievalOptions & {
        filter?: "base" | "operational" | ((layer: AnyLayer) => boolean);
    } = {}): AnyLayer[] {
        let filterFunc;
        if (typeof filter === "function") {
            filterFunc = filter;
        } else if (typeof filter === "string") {
            const filterType = filter;
            const topLevelFilter = (layer: Layer) => {
                return filterType === "base" ? layer.isBaseLayer : !layer.isBaseLayer;
            };
            filterFunc = (layer: AnyLayer) => {
                if (!layer.parent && "isBaseLayer" in layer) {
                    return topLevelFilter(layer);
                }
                // For nested children, include them all.
                return true;
            };
        }

        return getRecursiveLayers({
            from: this,
            filter: filterFunc,
            sortByDisplayOrder
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
