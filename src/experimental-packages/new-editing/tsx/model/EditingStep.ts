// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Feature } from "ol";
import type { Layer } from "ol/layer";
import type { FeatureTemplate } from "./FeatureTemplate";

export interface InitialStep {
    id: "none";
}

export interface DrawingStep {
    id: "create-draw";
    template: FeatureTemplate;
}

export interface SelectionStep {
    id: "update-select";
    olLayers: Layer[];
}

export interface CreationStep {
    id: "create-modify";
    feature: Feature;
    template: FeatureTemplate;
    drawOlLayer: Layer;
}

export interface UpdateStep {
    id: "update-modify";
    feature: Feature;
    olLayer: Layer | undefined;
}

export type EditingStep = InitialStep | DrawingStep | SelectionStep | CreationStep | UpdateStep;
export type ModificationStep = CreationStep | UpdateStep;
