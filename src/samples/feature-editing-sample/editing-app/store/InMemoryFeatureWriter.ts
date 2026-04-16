// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type {
    AddFeatureOptions,
    DeleteFeatureOptions,
    FeatureWriter,
    UpdateFeatureOptions
} from "@open-pioneer/feature-editing";
import { InMemoryStore } from "./InMemoryStore";

export class InMemoryFeatureWriter implements FeatureWriter {
    async addFeature({ feature, template }: AddFeatureOptions): Promise<void> {
        const store = InMemoryStore.get(template.layerId);
        await this.addArtificialDelay();
        store.addFeature(feature);
    }

    async updateFeature({ feature, layer }: UpdateFeatureOptions): Promise<void> {
        const store = InMemoryStore.get(layer?.id);
        await this.addArtificialDelay();
        store.updateFeature(feature);
    }

    async deleteFeature({ feature, layer }: DeleteFeatureOptions): Promise<void> {
        const store = InMemoryStore.get(layer?.id);
        await this.addArtificialDelay();
        store.deleteFeature(feature);
    }

    private addArtificialDelay(): Promise<void> {
        // Simulate server-side work.
        return new Promise((resolve) => setTimeout(resolve, 300));
    }
}
