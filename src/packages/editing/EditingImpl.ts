// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerBase, MapRegistry } from "@open-pioneer/map";
import { EditingService } from "./api";
import { EditingWorkflow } from "./EditingWorkflow";
import { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";

export interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

// todo rename file to EditingServiceImpl

export class EditingServiceImpl implements EditingService {
    private _serviceOptions: ServiceOptions<References>;
    private _workflows: Map<string, EditingWorkflow>;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._serviceOptions = serviceOptions;
        this._workflows = new Map();
    }

    start(layer: LayerBase): EditingWorkflow {
        const map = layer.map;
        const mapId = layer.map.id;

        let workflow = this._workflows.get(mapId);
        // TODO: fix typescript error in AppUI if Error is part of return type
        /*if (workflow) {
            return new Error(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        }*/

        workflow = new EditingWorkflow(map, this._serviceOptions);
        this._workflows.set(mapId, workflow);
        this._connectToWorkflowComplete(workflow, mapId);

        return workflow;
    }

    stop(mapId: string): Error | void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.stop();
        } else {
            return new Error("No workflow found for mapId" + mapId);
        }
    }

    reset(mapId: string): Error | void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.reset();
        } else {
            return new Error("No workflow found for mapId" + mapId);
        }
    }

    _connectToWorkflowComplete(workflow: EditingWorkflow, mapId: string) {
        workflow.whenComplete().finally(() => {
            this._workflows.delete(mapId);
        });
    }
}
