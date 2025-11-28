// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Feature } from "ol";
import type { Layer } from "ol/layer";
import type { Projection } from "ol/proj";
import type { FeatureTemplate } from "./FeatureTemplate";

export interface EditingHandler {
    readonly addFeature: AddFeatureHandler;
    readonly updateFeature: UpdateFeatureHandler;
    readonly deleteFeature: DeleteFeatureHandler;
}

export type AddFeatureHandler = (
    feature: Feature,
    template: FeatureTemplate,
    projection: Projection
) => Promise<void>;

export type UpdateFeatureHandler = (
    feature: Feature,
    olLayer: Layer | undefined,
    projection: Projection
) => Promise<void>;

export type DeleteFeatureHandler = (
    feature: Feature,
    olLayer: Layer | undefined,
    projection: Projection
) => Promise<void>;
