// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import type { EditingHandler, FeatureTemplate } from "new-editing";
import { InMemoryStore } from "./InMemoryStore";

export class InMemoryEditingHandler implements EditingHandler {
    async addFeature(feature: Feature, template: FeatureTemplate): Promise<void> {
        const store = InMemoryStore.get(template.layerId);
        await this.addArtificialDelay();
        store.addFeature(feature);
    }

    async updateFeature(feature: Feature, layer: Layer | undefined): Promise<void> {
        const store = InMemoryStore.get(layer?.id);
        await this.addArtificialDelay();
        store.updateFeature(feature);
    }

    async deleteFeature(feature: Feature, layer: Layer | undefined): Promise<void> {
        const store = InMemoryStore.get(layer?.id);
        await this.addArtificialDelay();
        store.deleteFeature(feature);
    }

    private addArtificialDelay(): Promise<void> {
        // Simulate server-side work.
        return new Promise((resolve) => setTimeout(resolve, 300));
    }
}
