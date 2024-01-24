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

// TODO: destroy und delete does not have effects each other
export class EditingImpl implements EditingService {
    private _serviceOptions: ServiceOptions<References>;
    private _workflows: Map<string, EditingWorkflow>;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._serviceOptions = serviceOptions;
        this._workflows = new Map();
    }

    start(layer: LayerBase): EditingWorkflow | Error {
        const map = layer.map;
        const mapId = layer.map.id;

        let workflow = this._workflows.get(mapId);
        if (workflow) {
            return new Error(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        }

        workflow = new EditingWorkflow(map, this._serviceOptions);
        this._workflows.set(mapId, workflow);

        workflow.whenComplete().then(() => {
            if (workflow) {
                workflow.destroy();
                this._workflows.delete(mapId);
            }
        });

        return workflow;
    }

    stop(mapId: string): void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.destroy();
        }

        this._workflows.delete(mapId);
    }

    reset(mapId: string): void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.reset();
        }
    }
}
