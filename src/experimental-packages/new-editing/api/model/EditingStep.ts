// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import type { Layer as OlLayer } from "ol/layer";
import type { FeatureTemplate } from "./FeatureTemplate";

/**
 * Represents the initial state when no editing operation is active.
 *
 * This is the default step when the editing workflow is idle. Users can select a feature
 * template to begin creating a new feature or switch to selection mode to edit existing features.
 */
export interface InitialStep {
    readonly id: "none";
}

/**
 * Represents the active drawing step when creating a new feature.
 *
 * This step is active when the user is drawing a new feature's geometry on the map using the
 * specified feature template. The user interacts with the map to define the geometry (point,
 * line, polygon, or circle) according to the template's configuration.
 */
export interface DrawingStep {
    readonly id: "create-draw";
    /** The feature template defining the geometry type and properties for the new feature. */
    readonly template: FeatureTemplate;
}

/**
 * Represents the selection step when choosing an existing feature to edit.
 *
 * This step is active when the user is selecting a feature from the map to modify or delete.
 * The user can click on features from the specified layers to begin editing them.
 */
export interface SelectionStep {
    readonly id: "update-select";
    /** The layers from which features can be selected for editing. */
    readonly layers: Layer[];
}

/**
 * Represents the modification step when editing a newly drawn feature.
 *
 * This step is active after a user has finished drawing a new feature's geometry and is now
 * modifying its shape or editing its properties before saving. The feature has not yet been
 * persisted to the backend.
 */
export interface CreationStep {
    readonly id: "create-modify";
    /** The feature being created and modified. */
    readonly feature: Feature;
    /** The feature template used to create the feature. */
    readonly template: FeatureTemplate;
    /** The temporary OpenLayers layer containing the feature during creation. */
    readonly drawOlLayer: OlLayer;
}

/**
 * Represents the modification step when editing an existing feature.
 *
 * This step is active when the user is modifying an existing feature that was selected from the
 * map. The user can change the feature's geometry or properties before saving the updates.
 */
export interface UpdateStep {
    readonly id: "update-modify";
    /** The existing feature being modified. */
    readonly feature: Feature;
    /** The layer containing the feature, or `undefined` if not available. */
    readonly layer: Layer | undefined;
}

/**
 * Union type representing all possible steps in the editing workflow.
 *
 * The editing workflow can be in one of these steps depending on the current operation:
 * - {@link InitialStep} - No active editing operation
 * - {@link DrawingStep} - Drawing a new feature's geometry
 * - {@link CreationStep} - Modifying a newly drawn feature
 * - {@link SelectionStep} - Selecting an existing feature to edit
 * - {@link UpdateStep} - Modifying an existing feature
 */
export type EditingStep = InitialStep | DrawingStep | SelectionStep | CreationStep | UpdateStep;

/**
 * Union type representing steps where a feature is being modified.
 *
 * This includes both creating new features ({@link CreationStep}) and updating existing features
 * ({@link UpdateStep}). Use this type when you need to handle both modification scenarios.
 */
export type ModificationStep = CreationStep | UpdateStep;
