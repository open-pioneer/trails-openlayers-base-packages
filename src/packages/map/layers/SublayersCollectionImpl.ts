// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    LayerRetrievalOptions,
    RecursiveRetrievalOptions,
    Sublayer,
    SublayerBaseType,
    SublayersCollection
} from "../api";
import { AbstractLayerBase } from "../layers/AbstractLayerBase";
import { getRecursiveLayers } from "./getRecursiveLayers";

/**
 * Manages the sublayers of a layer.
 */
// NOTE: adding / removing sublayers currently not supported
/* eslint-disable indent */
export class SublayersCollectionImpl<SublayerType extends SublayerBaseType & AbstractLayerBase>
    implements SublayersCollection<SublayerType>
{
    /* eslint-enable indent */
    #sublayers: SublayerType[];

    constructor(sublayers: SublayerType[]) {
        this.#sublayers = sublayers;
    }

    destroy() {
        for (const layer of this.#sublayers) {
            layer.destroy();
        }
        this.#sublayers = [];
    }

    // Generic method name for consistent interface
    getItems(options?: LayerRetrievalOptions): SublayerType[] {
        return this.getSublayers(options);
    }

    getSublayers(_options?: LayerRetrievalOptions | undefined): SublayerType[] {
        // NOTE: options are ignored because layers are always ordered at this time.
        return this.#sublayers.slice();
    }

    getRecursiveLayers(_options?: RecursiveRetrievalOptions): Sublayer[] {
        return getRecursiveLayers({
            // NOTE: This is safe (but not elegant) because this class does not know about the entire type hierarchy (unions).
            // _Might_ be possible to refactor this class to use the Sublayer union instead in the generic type parameters,
            // but then we might also introduce a cycle in the type definitions, which could be bad (?).
            from: this as unknown as SublayersCollection<Sublayer>,
            sortByDisplayOrder: _options?.sortByDisplayOrder,
            filter: _options?.filter
        }) as Sublayer[]; // we know for sure that all children are sublayers: sublayers do not point to layers
    }

    /**
     * Returns a reference to the internal sublayers array.
     *
     * NOTE: Do not modify directly!
     */
    __getRawSublayers(): SublayerType[] {
        return this.#sublayers;
    }
}
