// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel, MapRegistry } from "@open-pioneer/map";
import { EditingService } from "./api";
import { EditingWorkflowImpl } from "./EditingWorkflowImpl";
import { FlatStyleLike } from "ol/style/flat";
import { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";

export interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

export class EditingServiceImpl implements EditingService {
    private _serviceOptions: ServiceOptions<References>;
    private _workflows: Map<string, EditingWorkflowImpl>;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._serviceOptions = serviceOptions;
        this._workflows = new Map();
    }

    start(map: MapModel, ogcApiFeatureLayerUrl: URL): EditingWorkflowImpl {
        if (!ogcApiFeatureLayerUrl || !map || !map.id) {
            throw new Error("Map, mapId or url is undefined.");
        }

        const mapId = map.id;

        let workflow = this._workflows.get(mapId);
        if (workflow) {
            throw new Error(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        }

        workflow = new EditingWorkflowImpl({
            map,
            ogcApiFeatureLayerUrl,
            polygonDrawStyle: this._serviceOptions.properties.polygonDrawStyle as FlatStyleLike,
            httpService: this._serviceOptions.references.httpService,
            intl: this._serviceOptions.intl
        });
        this._workflows.set(mapId, workflow);
        this._connectToWorkflowComplete(workflow, mapId);

        return workflow;
    }

    stop(mapId: string): Error | void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.stop();
        } else {
            return new Error("No workflow found for mapId: " + mapId);
        }
    }

    reset(mapId: string): Error | void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.reset();
        } else {
            return new Error("No workflow found for mapId: " + mapId);
        }
    }

    _connectToWorkflowComplete(workflow: EditingWorkflowImpl, mapId: string) {
        workflow.whenComplete().finally(() => {
            this._workflows.delete(mapId);
        });
    }
}
