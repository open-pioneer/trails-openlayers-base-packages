// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Feature } from "ol";
import type { Layer } from "ol/layer";
import type { FeatureTemplate } from "./FeatureTemplate";

interface InitialStep {
    id: "none";
}

interface DrawingStep {
    id: "create-draw";
    template: FeatureTemplate;
}

interface SelectionStep {
    id: "update-select";
    layers: Layer[];
}

interface CreationStep {
    id: "create-modify";
    feature: Feature;
    template: FeatureTemplate;
    drawLayer: Layer;
}

interface UpdateStep {
    id: "update-modify";
    feature: Feature;
    layer: Layer | undefined;
}

export type EditingStep = InitialStep | DrawingStep | SelectionStep | CreationStep | UpdateStep;
export type ModificationStep = CreationStep | UpdateStep;
