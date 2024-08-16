// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerRetrievalOptions, Sublayer as SublayerInterface, SublayersCollection } from "../api";
import { AbstractLayerBase } from "./AbstractLayerBase";

// NOTE: adding / removing sublayers currently not supported
export class SublayersCollectionImpl<Sublayer extends SublayerInterface & AbstractLayerBase>
// eslint-disable-next-line indent
    implements SublayersCollection
{
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
