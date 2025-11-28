// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Collection, type Feature } from "ol";

export class InMemoryStore {
    static getOrCreate(id: string): InMemoryStore {
        return (InMemoryStore.stores[id] ??= new InMemoryStore());
    }

    static get(id: string | undefined): InMemoryStore {
        const store = id != null ? InMemoryStore.stores[id] : undefined;
        if (store != null) {
            return store;
        } else {
            throw new Error(`No such store with ID '${id}'.`);
        }
    }

    addFeature(feature: Feature): void {
        this.features.push(feature);
    }

    updateFeature(feature: Feature): void {
        // We'll need to replace the feature in the collection with a cloned version. Otherwise, its
        // geometry will not be updated in the map for some reason (invoking this.features.changed()
        // won't help).
        const index = this.features.getArray().indexOf(feature);
        this.features.setAt(index, feature.clone());
    }

    deleteFeature(feature: Feature): void {
        this.features.remove(feature);
    }

    getCollection(): Collection<Feature> {
        return this.features;
    }

    private readonly features = new Collection<Feature>();
    private static readonly stores: Record<string, InMemoryStore> = {};
}
