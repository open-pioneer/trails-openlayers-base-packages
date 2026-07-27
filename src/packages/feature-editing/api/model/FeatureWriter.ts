// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Layer } from "@open-pioneer/map";
import type { Feature } from "ol";
import type { Projection } from "ol/proj";
import type { FeatureTemplate } from "./FeatureTemplate";

/**
 * Interface defining the backing storage for feature editing operations.
 *
 * The `FeatureWriter` provides callback functions for creating, updating, and deleting features
 * in the editing workflow. Implementations of this interface are responsible for persisting
 * feature changes to the appropriate underlying data structures or storage systems.
 *
 * Note that the `FeatureWriter` does not _load_ features.
 * Features and their attributes are taken from the map.
 *
 * If any function throws an error, an error message will be shown to the user
 * via the NotificationService. On success, a success notification is shown.
 *
 * @example
 * ```ts
 * const featureWriter: FeatureWriter = {
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
 * @example Error handling
 *
 * If any function rejects with an error, that error will be logged and a generic error message
 * will be presented to the user.
 * Return an instance of {@link StorageError} instead if you want to include an additional user-visible message.
 *
 * ```ts
 * const featureWriter: FeatureWriter = {
 *     addFeature: async ({feature, template, projection}) => {
 *         // Option 1: Exceptions are logged and result in a generic error message
 *         throw new Error("Something went wrong");
 *
 *         // Option 2: Custom user-visible error message
 *         LOG.error("Failed to do X", error);
 *         return { kind: "error", message: "Insufficient permissions" };
 *     },
 * };
 * ```
 *
 * @group Model
 */
export interface FeatureWriter {
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
    addFeature(options: AddFeatureOptions): Promise<StorageResult>;

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
    updateFeature(options: UpdateFeatureOptions): Promise<StorageResult>;

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
    deleteFeature(options: DeleteFeatureOptions): Promise<StorageResult>;
}

/**
 * The result of a storage operation.
 *
 * - `void` and `undefined` indicate success
 * - throwing an error will result in that error being logged and a generic error message being shown
 * - use {@link StorageError} instead to show a custom error message to the user
 */
export type StorageResult = void | undefined | StorageError;

/**
 * Indicates a problem that occurred while saving or deleting a feature.
 */
export interface StorageError {
    kind: "error";

    /**
     * This message is included in the error notification shown to the user.
     */
    message?: string;
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
