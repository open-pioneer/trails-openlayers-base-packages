// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from "@open-pioneer/core";
import {
    LayerRetrievalOptions,
    SublayerModel,
    SublayersCollection,
    SublayersCollectionEvents
} from "../api";
import { AbstractLayerModelBase } from "./AbstractLayerModelBase";

// NOTE: adding / removing sublayers currently not supported
export class SublayersCollectionImpl<Sublayer extends SublayerModel & AbstractLayerModelBase>
    extends EventEmitter<SublayersCollectionEvents>
    implements SublayersCollection
{
    #sublayers: Sublayer[];

    constructor(sublayers: Sublayer[]) {
        super();
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
