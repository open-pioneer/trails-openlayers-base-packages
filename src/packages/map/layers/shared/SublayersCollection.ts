// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { getRecursiveLayers } from "./getRecursiveLayers";
import { LayerRetrievalOptions, RecursiveRetrievalOptions } from "./LayerRetrievalOptions";
import { Sublayer } from "../unions";
import { ChildrenCollection } from "./ChildrenCollection";
import { GET_RAW_SUBLAYERS } from "./internals";
import {
    assertInternalConstructor,
    InternalConstructorTag
} from "../../utils/InternalConstructorTag";
import { SublayerBaseType } from "./SublayerBaseType";

// Imported for typedoc
// eslint-disable-next-line unused-imports/no-unused-imports
import { Layer } from "../unions";

/**
 * Contains the sublayers that belong to a {@link Layer} or {@link Sublayer}.
 *
 * @group Layer Utilities
 */
// NOTE: adding / removing sublayers currently not supported
export class SublayersCollection<SublayerType extends SublayerBaseType>
    implements ChildrenCollection<SublayerType>
{
    #sublayers: SublayerType[];

    /** @internal */
    constructor(sublayers: SublayerType[], tag: InternalConstructorTag) {
        assertInternalConstructor(tag);
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

    /**
     * Returns the child sublayers in this collection.
     */
    getSublayers(_options?: LayerRetrievalOptions | undefined): SublayerType[] {
        // NOTE: sort options are ignored because layers are always ordered at this time.
        let allLayers = this.#sublayers.slice();

        if (!_options?.includeInternalLayers) {
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
     * > If the collection contains many, deeply nested sublayers, this function could potentially be expensive.
     */
    getRecursiveLayers(_options?: RecursiveRetrievalOptions): Sublayer[] {
        return getRecursiveLayers({
            // NOTE: This is safe (but not elegant) because this class does not know about the entire type hierarchy (unions).
            // _Might_ be possible to refactor this class to use the Sublayer union instead in the generic type parameters,
            // but then we might also introduce a cycle in the type definitions, which could be bad (?).
            from: this as unknown as SublayersCollection<Sublayer>,
            sortByDisplayOrder: _options?.sortByDisplayOrder,
            includeInternalLayers: _options?.includeInternalLayers,
            filter: _options?.filter
        }) as Sublayer[]; // we know for sure that all children are sublayers: sublayers do not point to layers
    }

    /**
     * Returns a reference to the internal sublayers array.
     *
     * NOTE: Do not modify directly!
     *
     * @internal
     */
    [GET_RAW_SUBLAYERS](): SublayerType[] {
        return this.#sublayers;
    }
}
