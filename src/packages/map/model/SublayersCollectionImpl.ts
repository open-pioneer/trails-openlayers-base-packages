// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerRetrievalOptions, SublayerBaseType, SublayersCollection } from "../api";
import { AbstractLayerBase } from "./AbstractLayerBase";

/**
 * Manages the sublayers of a layer.
 */
// NOTE: adding / removing sublayers currently not supported
/* eslint-disable indent */
export class SublayersCollectionImpl<Sublayer extends SublayerBaseType & AbstractLayerBase>
    implements SublayersCollection<Sublayer>
{
    /* eslint-enable indent */
    #sublayers: Sublayer[];

    constructor(sublayers: Sublayer[]) {
        this.#sublayers = sublayers;
    }

    destroy() {
        for (const layer of this.#sublayers) {
            layer.destroy();
        }
        this.#sublayers = [];
    }

    // Generic method name for consistent interface
    getItems(options?: LayerRetrievalOptions): Sublayer[] {
        return this.getSublayers(options);
    }

    getSublayers(_options?: LayerRetrievalOptions | undefined): Sublayer[] {
        // NOTE: options are ignored because layers are always ordered at this time.
        return this.#sublayers.slice();
    }

    /**
     * Returns a reference to the internal sublayers array.
     *
     * NOTE: Do not modify directly!
     */
    __getRawSublayers(): Sublayer[] {
        return this.#sublayers;
    }
}
