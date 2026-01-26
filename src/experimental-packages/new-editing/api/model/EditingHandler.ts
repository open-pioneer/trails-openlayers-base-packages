// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import type { Projection } from "ol/proj";
import type { FeatureTemplate } from "./FeatureTemplate";

/**
 * Interface defining the handlers for feature editing operations.
 *
 * The `EditingHandler` provides callback functions for creating, updating, and deleting features
 * in the editing workflow. Implementations of this interface are responsible for persisting
 * feature changes to a backend service or data store.
 *
 * If any handler throws an error, it will be caught and displayed to the user as an error
 * notification via the NotificationService. On success, a success notification is shown.
 *
 * @example
 * ```ts
 * const editingHandler: EditingHandler = {
 *     addFeature: async (feature, template, projection) => {
 *         // Persist the new feature to your backend
 *     },
 *     updateFeature: async (feature, layer, projection) => {
 *         // Update the existing feature in your backend
 *     },
 *     deleteFeature: async (feature, layer, projection) => {
 *         // Delete the feature from your backend
 *     }
 * };
 * ```
 */
export interface EditingHandler {
    /** Handler function called when a new feature is created. */
    readonly addFeature: AddFeatureHandler;

    /** Handler function called when an existing feature is modified. */
    readonly updateFeature: UpdateFeatureHandler;

    /** Handler function called when a feature is deleted. */
    readonly deleteFeature: DeleteFeatureHandler;
}

/**
 * Handler function type for adding a new feature.
 *
 * Called when a user creates a new feature using a feature template. The implementation should
 * persist the feature to a backend service. If the handler throws an error, an error notification
 * is displayed to the user; otherwise, a success notification is shown.
 *
 * @param feature - The OpenLayers feature that was created.
 * @param template - The feature template used to create the feature, containing metadata such as
 * geometry type, layer ID, and form configuration.
 * @param projection - The projection of the feature's geometry, or `undefined` if not available.
 * @returns A promise that resolves when the feature has been successfully added, or rejects with
 * an error if the operation fails.
 */
export type AddFeatureHandler = (
    feature: Feature,
    template: FeatureTemplate,
    projection: Projection | undefined
) => Promise<void>;

/**
 * Handler function type for updating an existing feature.
 *
 * Called when a user modifies an existing feature's geometry or properties. The implementation
 * should persist the changes to a backend service. If the handler throws an error, an error
 * notification is displayed to the user; otherwise, a success notification is shown.
 *
 * @param feature - The OpenLayers feature that was modified.
 * @param layer - The layer containing the feature, or `undefined` if not available.
 * @param projection - The projection of the feature's geometry, or `undefined` if not available.
 * @returns A promise that resolves when the feature has been successfully updated, or rejects
 * with an error if the operation fails.
 */
export type UpdateFeatureHandler = (
    feature: Feature,
    layer: Layer | undefined,
    projection: Projection | undefined
) => Promise<void>;

/**
 * Handler function type for deleting a feature.
 *
 * Called when a user requests deletion of an existing feature. The implementation should remove
 * the feature from a backend service. If the handler throws an error, an error notification is
 * displayed to the user; otherwise, a success notification is shown.
 *
 * @param feature - The OpenLayers feature to be deleted.
 * @param layer - The layer containing the feature, or `undefined` if not available.
 * @param projection - The projection of the feature's geometry, or `undefined` if not available.
 * @returns A promise that resolves when the feature has been successfully deleted, or rejects
 * with an error if the operation fails.
 */
export type DeleteFeatureHandler = (
    feature: Feature,
    layer: Layer | undefined,
    projection: Projection | undefined
) => Promise<void>;
