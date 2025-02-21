// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { GeoJSON } from "ol/format";
import { bbox } from "ol/loadingstrategy";
import { Vector as VectorSource } from "ol/source";

import type { IDBFeatureStore } from "../store/IDBFeatureStore";

export class IDBVectorSource extends VectorSource {
    constructor(private readonly store: IDBFeatureStore) {
        super({
            format: new GeoJSON(),
            strategy: bbox,
            loader: async (extent, _, projection, success, failure) => {
                try {
                    const features = await this.store.queryFeaturesInExtent(extent, projection);
                    this.addFeatures(features);
                    success?.(features);
                } catch (error) {
                    console.error("Error reading features for extent", extent, error);
                    failure?.();
                }
            }
        });
    }
}
