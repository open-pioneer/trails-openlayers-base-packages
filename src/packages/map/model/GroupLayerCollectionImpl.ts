// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { GroupCollectionLayer, GroupLayerCollection, LayerRetrievalOptions, SublayerBaseType, SublayersCollection } from "../api";
import { AbstractLayerBase } from "./AbstractLayerBase";

// NOTE: adding / removing  currently not supported
/* eslint-disable indent */
export class GroupLayerCollectionImpl
    implements GroupLayerCollection
{
    #layers: GroupCollectionLayer[];

    constructor(layers: GroupCollectionLayer[]) {
        this.#layers = layers;
    }

    destroy() {
        for (const layer of this.#layers) {
            layer.destroy();
        }
        this.#layers = [];
    }

    getLayers(_options?: LayerRetrievalOptions | undefined): GroupCollectionLayer[] {
        // NOTE: options are ignored because layers are always ordered at this time.
        return this.#layers.slice();
    }

    /**
     * Returns a reference to the internal group layer array.
     *
     * NOTE: Do not modify directly!
     */
    __getRawSublayers(): GroupCollectionLayer[] {
        return this.#layers;
    }
}
