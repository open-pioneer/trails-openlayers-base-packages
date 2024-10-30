// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { GroupLayerCollection, Layer, LayerRetrievalOptions } from "../api";
import { GroupLayer } from "../api/layers/GroupLayer";
import { AbstractLayer } from "./AbstractLayer";
import { AbstractLayerBase } from "./AbstractLayerBase";

// NOTE: adding / removing  currently not supported
/* eslint-disable indent */
export class GroupLayerCollectionImpl implements GroupLayerCollection {
    #layers: (AbstractLayer & Layer)[];
    #parent: GroupLayer;

    constructor(layers: Layer[], parent: GroupLayer) {
        const abstractLayers = [];
        for (const layer of layers) {
            if (layer instanceof AbstractLayer) {
                abstractLayers.push(layer);
                layer.__attachToGroup(parent); //attach every layer to the parent group layer
            } else {
                throw new Error(
                    `layer '${layer.id}' of group '${parent.id}' does not implement abstract class '${AbstractLayerBase.name}`
                );
            }
        }
        this.#layers = abstractLayers;
        this.#parent = parent;
    }

    getLayers(_options?: LayerRetrievalOptions | undefined): Layer[] {
        // NOTE: options are ignored because layers are always ordered at this time.
        return this.#layers.map((layer) => layer as unknown as Layer); //save since Layer[] is passed to the consturctor
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
     * destroys this collection, all contained layers are detached from their parent group layer
     */
    destroy() {
        for (const layer of this.#layers) {
            layer.__detachFromGroup();
        }
        this.#layers = [];
    }

    /**
     * returns the parent group layer of all layers that are contained in this collection
     */
    getParent(): GroupLayer {
        return this.#parent;
    }
}
