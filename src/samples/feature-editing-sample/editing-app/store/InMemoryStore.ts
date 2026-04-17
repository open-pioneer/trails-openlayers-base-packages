// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Collection, type Feature } from "ol";

/**
 * An in-memory database of feature collections.
 *
 * In this example, all editable features are stored in an InMemoryStore.
 *
 * Stores are referenced using an id.
 *
 * Each store contains a feature collection that can serve as the data source of a vector layer.
 * Features can be added, updated or removed dynamically.
 * Vector layers that use the feature collection will be updated automatically whenever the
 * collection is modified.
 *
 * > NOTE: For the sake of simplicity, this storage uses global in memory storage.
 * > You would typically use local storage or some backend to store the actual data.
 */
export class InMemoryStore {
    private static readonly stores: Record<string, InMemoryStore> = {};

    /** Returns the store associated with the given id, creating it if necessary. */
    static getOrCreate(id: string): InMemoryStore {
        return (InMemoryStore.stores[id] ??= new InMemoryStore());
    }

    /** Returns the storage with the given id, throwing an exception if none exists. */
    static get(id: string | undefined): InMemoryStore {
        const store = id != null ? InMemoryStore.stores[id] : undefined;
        if (store != null) {
            return store;
        } else {
            throw new Error(`No such store with ID '${id}'.`);
        }
    }

    private readonly features = new Collection<Feature>();

    /** Adds a new feature to the underlying feature collection. */
    addFeature(feature: Feature): void {
        this.features.push(feature.clone());
    }

    /** Updates a feature in the underlying feature collection. */
    updateFeature(feature: Feature): void {
        const index = this.features.getArray().indexOf(feature);
        this.features.setAt(index, feature.clone());
    }

    /** Removes a feature from the underlying feature collection.  */
    deleteFeature(feature: Feature): void {
        this.features.remove(feature);
    }

    /** Returns a direct reference to the underlying feature collection. */
    getCollection(): Collection<Feature> {
        return this.features;
    }
}
