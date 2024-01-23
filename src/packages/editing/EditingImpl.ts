// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerBase, MapRegistry } from "@open-pioneer/map";
import { Editing } from "./api";
import { EditingWorkflow } from "./EditingWorkflow";
import { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";

export interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

export class EditingImpl implements Editing {
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
        if (workflow) {
            this._workflows.delete(mapId);
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

    stop(mapId: string) {
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
