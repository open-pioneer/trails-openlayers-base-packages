// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import type { DeclaredService } from "@open-pioneer/runtime";

/**
 * state of an editing workflow
 */
export type EditingWorkflowState =
    | "active:initialized"
    | "active:drawing"
    | "active:saving"
    | "inactive";

/** Events emitted by the {@link EditingWorkflow}. */
export interface EditingWorkflowEvents {
    /**
     * initial state after editing workflow was started
     */
    "active:initialized": void;

    /**
     * state after user adds the first vertex of the geometry
     */
    "active:drawing": void;

    /**
     * state while feature is being saved after user finished the geometry
     */
    "active:saving": void;

    /**
     * state after user stops editing
     */
    "inactive": void;
}

// TODO:
// - Rename interface to EditingWorkflow (and class to *impl, for example)
// - Add (?) stop/reset here too
export interface EditingWorkflowType extends EventEmitter<EditingWorkflowEvents> {
    /**
     * Returns the current state of the editing workflow.
     */
    getState(): EditingWorkflowState;

    /**
     * Wait for the user to finish the editing. The returned promise rejects if saving the feature
     * failed. It resolves with undefined when the editing was stopped and resolves with the
     * feature ID when saving was successful.
     */
    whenComplete(): Promise<string | undefined>;
}

export interface EditingService extends DeclaredService<"editing.EditingService"> {
    /**
     * Creates and initializes a new {@link EditingWorkflow}.
     */
    start(map: MapModel, ogcApiFeatureLayerUrl: URL): EditingWorkflowType;

    /**
     * Stops the edit mode and removes an existing {@link EditingWorkflow}.
     */
    stop(mapId: string): void;

    /**
     * Removes the unfinished geometry from an existing {@link EditingWorkflow} without leaving the edit mode.
     */
    reset(mapId: string): void;
}
