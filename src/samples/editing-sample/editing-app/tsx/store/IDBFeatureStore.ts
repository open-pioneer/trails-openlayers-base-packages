// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Feature } from "ol";
import type { Extent } from "ol/extent";
import type { Projection } from "ol/proj";

import { FeatureEntity, getFeatureEntityEnvelope } from "./database/FeatureEntity";
import { FeatureDatabase } from "./database/FeatureDatabase";
import { GeometrySerializer } from "./geometry/GeometrySerializer";
import { envelopesOverlap } from "./geometry/Envelope";

export class IDBFeatureStore {
    constructor(databaseName: string, { wkid }: IDBFeatureStoreOptions) {
        this.db = new FeatureDatabase(databaseName);
        this.serializer = new GeometrySerializer(wkid);
    }

    queryFeaturesInExtent(extent: Extent, projection: Projection): Promise<Feature[]> {
        const envelope = this.serializer.toTransformedEnvelope(extent, projection);
        return this.db.features
            .filter((entity) => {
                // Despite its inferred type, 'entity' is not an instance of the FeatureEntity class
                const featureEnvelope = getFeatureEntityEnvelope(entity);
                return featureEnvelope != null && envelopesOverlap(featureEnvelope, envelope);
            })
            .toArray((entities) => entities.map((entity) => this.toFeature(entity, projection)));
    }

    addFeature(feature: Feature, source: Projection): Promise<number | undefined> {
        const entity = this.toEntity(feature, source);
        return this.db.features.add(entity);
    }

    updateFeature(feature: Feature, source: Projection): Promise<number | undefined> {
        const entity = this.toEntity(feature, source);
        return this.db.features.put(entity);
    }

    deleteFeature(feature: Feature): Promise<void> {
        const id = this.extractId(feature);
        return this.db.features.delete(id);
    }

    private toFeature(entity: FeatureEntity, target: Projection): Feature {
        const feature = new Feature({
            ...entity.attributes,
            geometry: this.serializer.toGeometry(entity.geometryString, target)
        });
        feature.setId(entity.id);
        return feature;
    }

    private toEntity(feature: Feature, source: Projection): FeatureEntity {
        const geometry = feature.getGeometry();

        return new FeatureEntity({
            id: feature.getId(),
            attributes: this.getAttributes(feature),
            geometryString: this.serializer.toGeometryString(geometry, source),
            envelope: this.serializer.getTransformedEnvelope(geometry, source)
        });
    }

    private extractId(feature: Feature): number | undefined {
        const { id } = new FeatureEntity({
            id: feature.getId(),
            attributes: feature.getProperties()
        });
        return id;
    }

    private getAttributes(feature: Feature): Record<string, unknown> {
        const properties = feature.getProperties();
        const geometryName = feature.getGeometryName();
        return { ...properties, [geometryName]: undefined };
    }

    private readonly db: FeatureDatabase;
    private readonly serializer: GeometrySerializer;
}

interface IDBFeatureStoreOptions {
    readonly wkid: number;
}
