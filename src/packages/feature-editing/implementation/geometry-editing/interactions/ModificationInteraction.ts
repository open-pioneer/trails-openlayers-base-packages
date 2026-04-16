// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Collection, type Feature } from "ol";
import { Modify } from "ol/interaction";
import type { Geometry } from "ol/geom";
import { BaseInteraction } from "./BaseInteraction";
import type { ModificationOptions } from "../../../api/model/InteractionOptions";
import type { SimpleLayer } from "@open-pioneer/map";

export interface ModificationParameters {
    readonly feature: Feature;
    readonly drawLayer?: SimpleLayer;
    readonly modificationOptions?: ModificationOptions;
}

interface Data {
    readonly feature: Feature;
    readonly modify: Modify;
    readonly drawLayer: SimpleLayer | undefined;
    readonly originalGeometry: Geometry | undefined;
}

export class ModificationInteraction extends BaseInteraction<ModificationParameters, Data> {
    protected override startInteraction(parameters: ModificationParameters): Data {
        const { feature, drawLayer, modificationOptions } = parameters;

        const features = new Collection([feature]);
        const modify = new Modify({ features, ...modificationOptions });
        const originalGeometry = feature.getGeometry()?.clone();

        if (drawLayer != null) {
            this.mapModel.layers.addLayer(drawLayer);
        }

        this.map.addInteraction(modify);

        return { feature, modify, drawLayer, originalGeometry };
    }

    protected override stopInteraction(data: Data): void {
        const { feature, modify, drawLayer, originalGeometry } = data;

        this.map.removeInteraction(modify);

        if (drawLayer != null) {
            this.mapModel.layers.removeLayer(drawLayer);
        }
        if (originalGeometry != null) {
            feature.setGeometry(originalGeometry);
        }
    }
}
