// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerBase } from "@open-pioneer/map";
import type { DeclaredService } from "@open-pioneer/runtime";
import { EditingWorkflow } from "./EditingWorkflow";

// TODO: Add documentation

export type EditingWorkflowState = "active:initialized" | "active:drawing" | "active:saving";

/** Events emitted by the {@link EditingWorkflow}. */
export interface EditingWorkflowEvents {
    "active:initialized": void;
    "active:drawing": void;
    "active:saving": void;
}

export interface EditingWorkflowType {
    getState(): EditingWorkflowState;

    whenComplete(): Promise<string | undefined>;
}

export interface EditingService extends DeclaredService<"editing.EditingService"> {
    start(layer: LayerBase): EditingWorkflow;

    stop(mapId: string): void;

    reset(mapId: string): void;
}
