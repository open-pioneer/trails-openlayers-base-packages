// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { MapModel } from "@open-pioneer/map";
import type { DeclaredService, PackageIntl } from "@open-pioneer/runtime";
import { Feature } from "ol";
import { FlatStyle } from "ol/style/flat";

/**
 * State of an editing workflow
 *
 * "active:initialized":
 * Initial state after editing workflow was started but user has not yet started drawing.
 *
 * "active:drawing":
 * State while user is drawing a feature. State is entered when user adds the first vertex of the geometry (`create-mode`).
 * State while user is updating an existing feature. State is entered when user moved the first vertex of the geometry (`update-mode`).
 *
 * "active:saving":
 * State while feature is being saved after user finished the geometry drawing.
 *
 * "destroyed:
 * state after editing is stopped.
 *
 */
export type EditingWorkflowState =
    | "active:initialized"
    | "active:drawing"
    | "active:saving"
    | "destroyed";

/**
 * Props of an editing workflow
 */
export interface EditingWorkflowProps {
    map: MapModel;
    ogcApiFeatureLayerUrl: URL;
    polygonStyle: FlatStyle;
    vertexStyle: FlatStyle;
    httpService: HttpService;
    intl: PackageIntl;
}

/**
 * EditingWorkflows are created by the {@link EditingService}
 * and represent a currently ongoing editing workflow.
 */
export interface EditingWorkflow {
    /**
     * Stops this editing operation.
     */
    stop(): void;

    /**
     * Resets this workflow to its initial state.
     */
    reset(): void;

    /**
     * Returns the current state of the editing workflow.
     */
    getState(): EditingWorkflowState;

    /**
     * Trigger saving the currently drawn/updated feature.
     */
    triggerSave(): void;

    /**
     * Wait for the editing to be finished. The returned promise resolves with the
     * feature ID when saving was successful and rejects if saving the feature
     * failed. It resolves with undefined when the editing was stopped.
     */
    whenComplete(): Promise<Record<string, string> | undefined>;
}

/**
 * The editing service allows to start and handle editing workflows.
 *
 * Inject an instance of this service by referencing the interface name `"editing.EditingService"`.
 */
export interface EditingService extends DeclaredService<"editing.EditingService"> {
    /**
     * Creates and initializes a new {@link EditingWorkflow} to create a geometry.
     */
    createFeature(map: MapModel, ogcApiFeatureLayerUrl: URL): EditingWorkflow;

    /**
     * Creates and initializes a new {@link EditingWorkflow} to update an existing feature's geometry.
     */
    updateFeature(map: MapModel, ogcApiFeatureLayerUrl: URL, feature: Feature): EditingWorkflow;

    /**
     * Stops the edit mode and removes an existing {@link EditingWorkflow}.
     */
    stop(mapId: string): void;

    /**
     * Resets the unfinished geometry from an existing {@link EditingWorkflow} without leaving the edit mode.
     */
    reset(mapId: string): void;
}
