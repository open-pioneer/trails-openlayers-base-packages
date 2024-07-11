// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel, MapRegistry } from "@open-pioneer/map";
import { EditingService } from "./api";
import { EditingCreateWorkflowImpl } from "./EditingCreateWorkflowImpl";
import { EditingUpdateWorkflowImpl } from "./EditingUpdateWorkflowImpl";
import { FlatStyle } from "ol/style/flat";
import { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";
import { Feature } from "ol";

export interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

export class EditingServiceImpl implements EditingService {
    private _serviceOptions: ServiceOptions<References>;
    private _workflows: Map<string, EditingCreateWorkflowImpl | EditingUpdateWorkflowImpl>;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._serviceOptions = serviceOptions;
        this._workflows = new Map();
    }

    createFeature(map: MapModel, ogcApiFeatureLayerUrl: URL): EditingCreateWorkflowImpl {
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

        workflow = new EditingCreateWorkflowImpl({
            map,
            ogcApiFeatureLayerUrl,
            polygonStyle: this._serviceOptions.properties.polygonStyle as FlatStyle,
            vertexStyle: this._serviceOptions.properties.vertexStyle as FlatStyle,
            httpService: this._serviceOptions.references.httpService,
            intl: this._serviceOptions.intl
        });
        this._workflows.set(mapId, workflow);
        this._connectToWorkflowDestroyEvent(workflow, mapId);

        return workflow;
    }

    updateFeature(
        map: MapModel,
        ogcApiFeatureLayerUrl: URL,
        feature: Feature
    ): EditingUpdateWorkflowImpl {
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

        workflow = new EditingUpdateWorkflowImpl({
            map,
            ogcApiFeatureLayerUrl,
            feature,
            polygonStyle: this._serviceOptions.properties.polygonStyle as FlatStyle,
            vertexStyle: this._serviceOptions.properties.vertexStyle as FlatStyle,
            httpService: this._serviceOptions.references.httpService,
            intl: this._serviceOptions.intl
        });
        this._workflows.set(mapId, workflow);
        this._connectToWorkflowDestroyEvent(workflow, mapId);

        return workflow;
    }

    stop(mapId: string): void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.stop();
        }
        // A missing workflow is not an error if all we want to do is stop it.
    }

    reset(mapId: string): void {
        const workflow = this._workflows.get(mapId);
        if (workflow) {
            workflow.reset();
        } else {
            throw new Error("No workflow found for mapId: " + mapId);
        }
    }

    _connectToWorkflowDestroyEvent(
        workflow: EditingCreateWorkflowImpl | EditingUpdateWorkflowImpl,
        mapId: string
    ) {
        workflow.on("destroyed", () => {
            if (this._workflows.get(mapId) === workflow) {
                this._workflows.delete(mapId);
            }
        });
    }
}
