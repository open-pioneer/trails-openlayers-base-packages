// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerBase } from "@open-pioneer/map";
import type { DeclaredService } from "@open-pioneer/runtime";
import { EditingWorkflow } from "./EditingWorkflow";

export interface Editing extends DeclaredService<"editing.Editing"> {
    start(layer: LayerBase): EditingWorkflow;

    stop(mapId: string): void;

    reset(mapId: string): void;
}
