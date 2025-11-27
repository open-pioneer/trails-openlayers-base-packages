// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { default as Dexie, type EntityTable } from "dexie";
import { FeatureEntity } from "./FeatureEntity";

export class FeatureDatabase extends Dexie {
    constructor(name: string) {
        super(name);
        this.version(1).stores({
            features: FeatureEntity.SCHEMA_DEFINITION
        });
        this.features.mapToClass(FeatureEntity);
    }

    readonly features!: EntityTable<FeatureEntity, "id">;
}
