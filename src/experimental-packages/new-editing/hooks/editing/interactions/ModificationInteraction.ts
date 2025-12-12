// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Collection, type Feature } from "ol";
import { Modify } from "ol/interaction";

import type { Geometry } from "ol/geom";
import type { Options } from "ol/interaction/Modify";
import type { Layer } from "ol/layer";

import { BaseInteraction } from "../base/BaseInteraction";

export class ModificationInteraction extends BaseInteraction<ModificationOptions, Data> {
    protected override startInteraction(options: ModificationOptions): Data {
        const { feature, drawLayer, modifyOptions } = options;

        const features = new Collection([feature]);
        const modify = new Modify({ features, ...modifyOptions });
        const originalGeometry = feature.getGeometry()?.clone();

        if (drawLayer != null) {
            this.map.addLayer(drawLayer);
        }

        this.map.addInteraction(modify);

        return { feature, modify, drawLayer, originalGeometry };
    }

    protected override stopInteraction(data: Data): void {
        const { feature, modify, drawLayer, originalGeometry } = data;

        this.map.removeInteraction(modify);

        if (drawLayer != null) {
            this.map.removeLayer(drawLayer);
        }
        if (originalGeometry != null) {
            feature.setGeometry(originalGeometry);
        }
    }
}

export interface ModificationOptions {
    readonly feature: Feature;
    readonly drawLayer?: Layer;
    readonly modifyOptions?: ModifyOptions;
}

export type ModifyOptions = Omit<Options, "features" | "source">;

interface Data {
    readonly feature: Feature;
    readonly modify: Modify;
    readonly drawLayer: Layer | undefined;
    readonly originalGeometry: Geometry | undefined;
}
