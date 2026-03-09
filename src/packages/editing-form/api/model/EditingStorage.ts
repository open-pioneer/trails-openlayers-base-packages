// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import type { Projection } from "ol/proj";
import type { FeatureTemplate } from "./FeatureTemplate";

/**
 * Interface defining the backing storage for feature editing operations.
 *
 * The `EditingStorage` provides callback functions for creating, updating, and deleting features
 * in the editing workflow. Implementations of this interface are responsible for persisting
 * feature changes to a backend service or data store.
 *
 * If any function throws an error, it will be caught and displayed to the user as an error
 * notification via the NotificationService. On success, a success notification is shown.
 *
 * @example
 * ```ts
 * const editingStorage: EditingStorage = {
 *     addFeature: async ({feature, template, projection}) => {
 *         // Persist the new feature to your backend
 *     },
 *     updateFeature: async ({feature, layer, projection}) => {
 *         // Update the existing feature in your backend
 *     },
 *     deleteFeature: async ({feature, layer, projection}) => {
 *         // Delete the feature from your backend
 *     }
 * };
 * ```
 *
 * @group Model
 */
export interface EditingStorage {
    /**
     * Called for adding a new feature.
     *
     * Called when a user creates a new feature using a feature template. The implementation should
     * persist the feature to a backend service. If the function throws an error, an error notification
     * is displayed to the user; otherwise, a success notification is shown.
     *
     * @returns A promise that resolves when the feature has been successfully added, or rejects with
     * an error if the operation fails.
     */
    addFeature(options?: AddFeatureOptions): Promise<void>;

    /**
     * Called for updating an existing feature.
     *
     * Called when a user modifies an existing feature's geometry or properties. The implementation
     * should persist the changes to a backend service. If the function throws an error, an error
     * notification is displayed to the user; otherwise, a success notification is shown.
     *
     * @returns A promise that resolves when the feature has been successfully updated, or rejects
     * with an error if the operation fails.
     */
    updateFeature(options?: UpdateFeatureOptions): Promise<void>;

    /**
     * Called for deleting a feature.
     *
     * Called when a user requests deletion of an existing feature. The implementation should remove
     * the feature from a backend service. If the function throws an error, an error notification is
     * displayed to the user; otherwise, a success notification is shown.
     *
     * @returns A promise that resolves when the feature has been successfully deleted, or rejects
     * with an error if the operation fails.
     */
    deleteFeature(options?: DeleteFeatureOptions): Promise<void>;
}

/** @group Model */
export interface AddFeatureOptions {
    /** The OpenLayers feature that was created. */
    feature: Feature;

    /** The feature template used to create the feature. */
    template: FeatureTemplate;

    /** The projection of the feature's geometry, or `undefined` if not available. */
    projection: Projection | undefined;
}

/** @group Model */
export interface UpdateFeatureOptions {
    /** The OpenLayers feature that was modified. */
    feature: Feature;

    /** The layer containing the feature, or `undefined` if not available. */
    layer: Layer | undefined;

    /** The projection of the feature's geometry, or `undefined` if not available. */
    projection: Projection | undefined;
}

/** @group Model */
export interface DeleteFeatureOptions {
    /** The OpenLayers feature to be deleted. */
    feature: Feature;

    /** The layer containing the feature, or `undefined` if not available. */
    layer: Layer | undefined;

    /** The projection of the feature's geometry, or `undefined` if not available. */
    projection: Projection | undefined;
}
