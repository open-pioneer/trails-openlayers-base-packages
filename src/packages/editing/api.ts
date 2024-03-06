// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { MapModel } from "@open-pioneer/map";
import type { DeclaredService, PackageIntl } from "@open-pioneer/runtime";
import { Feature } from "ol";
import { FlatStyleLike } from "ol/style/flat";

/**
 * State of an editing workflow
 */
export type EditingWorkflowState =
    | "active:initialized"
    | "active:drawing"
    | "active:saving"
    | "destroyed";

/**
 * Events emitted by the {@link EditingWorkflow}.
 */
export interface EditingWorkflowEvents {
    /**
     * Initial state after editing workflow was started but user has not yet started drawing.
     */
    "active:initialized": void;

    /**
     * State while user is drawing a feature. State is entered when user adds the first vertex of the geometry (`create-mode`).
     * State while user is updating an existing feature. State is entered when user moved the first vertex of the geometry (`update-mode`).
     */
    "active:drawing": void;

    /**
     * State while feature is being saved after user finished the geometry drawing.
     */
    "active:saving": void;

    /**
     * State after editing is stopped.
     */
    "destroyed": void;
}

/**
 * Props of an editing workflow
 */
export interface EditingWorkflowProps {
    map: MapModel;
    ogcApiFeatureLayerUrl: URL;
    polygonStyle: FlatStyleLike;
    vertexStyle: FlatStyleLike;
    httpService: HttpService;
    intl: PackageIntl;
}

/**
 * EditingWorkflows are created by the {@link EditingService}
 * and represent a currently ongoing editing workflow.
 */
export interface EditingWorkflow extends EventEmitter<EditingWorkflowEvents> {
    /**
     * Returns the current state of the editing workflow.
     */
    getState(): EditingWorkflowState;

    /**
     * Trigger saving the current feature.
     */
    save(): void;

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
     * Creates and initializes a new {@link EditingWorkflow} to create geometries.
     */
    create(map: MapModel, ogcApiFeatureLayerUrl: URL): EditingWorkflow;

    /**
     * Creates and initializes a new {@link EditingWorkflow} to update geometries.
     */
    update(map: MapModel, ogcApiFeatureLayerUrl: URL, feature: Feature): EditingWorkflow;

    /**
     * Stops the edit mode and removes an existing {@link EditingWorkflow}.
     */
    stop(mapId: string): void;

    /**
     * Removes the unfinished geometry from an existing {@link EditingWorkflow} without leaving the edit mode.
     */
    reset(mapId: string): void;
}
