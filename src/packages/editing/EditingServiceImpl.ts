// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerFactory, MapModel, MapRegistry } from "@open-pioneer/map";
import { EditingService } from "./api";
import { EditingCreateWorkflowImpl } from "./EditingCreateWorkflowImpl";
import { EditingUpdateWorkflowImpl } from "./EditingUpdateWorkflowImpl";
import { FlatStyle } from "ol/style/flat";
import { ServiceOptions } from "@open-pioneer/runtime";
import { HttpService } from "@open-pioneer/http";
import { Feature } from "ol";
import { watch } from "@conterra/reactivity-core";

export interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
    layerFactory: LayerFactory;
}

export class EditingServiceImpl implements EditingService {
    #serviceOptions: ServiceOptions<References>;
    #workflows: Map<string, EditingCreateWorkflowImpl | EditingUpdateWorkflowImpl>;

    constructor(serviceOptions: ServiceOptions<References>) {
        this.#serviceOptions = serviceOptions;
        this.#workflows = new Map();
    }

    createFeature(map: MapModel, ogcApiFeatureLayerUrl: URL): EditingCreateWorkflowImpl {
        if (!ogcApiFeatureLayerUrl || !map || !map.id) {
            throw new Error("Map, mapId or url is undefined.");
        }

        const mapId = map.id;

        let workflow = this.#workflows.get(mapId);
        if (workflow) {
            throw new Error(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        }

        workflow = new EditingCreateWorkflowImpl({
            map,
            ogcApiFeatureLayerUrl,
            polygonStyle: this.#serviceOptions.properties.polygonStyle as FlatStyle,
            vertexStyle: this.#serviceOptions.properties.vertexStyle as FlatStyle,
            httpService: this.#serviceOptions.references.httpService,
            layerFactory: this.#serviceOptions.references.layerFactory,
            intl: this.#serviceOptions.currentIntl
        });
        this.#workflows.set(mapId, workflow);
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

        let workflow = this.#workflows.get(mapId);
        if (workflow) {
            throw new Error(
                "EditingWorkflow could not be started. EditingWorkflow already in progress for this map."
            );
        }

        workflow = new EditingUpdateWorkflowImpl({
            map,
            ogcApiFeatureLayerUrl,
            feature,
            polygonStyle: this.#serviceOptions.properties.polygonStyle as FlatStyle,
            vertexStyle: this.#serviceOptions.properties.vertexStyle as FlatStyle,
            httpService: this.#serviceOptions.references.httpService,
            layerFactory: this.#serviceOptions.references.layerFactory,
            intl: this.#serviceOptions.currentIntl
        });
        this.#workflows.set(mapId, workflow);
        this._connectToWorkflowDestroyEvent(workflow, mapId);

        return workflow;
    }

    stop(map: string | MapModel): void {
        const mapId = typeof map === "string" ? map : map.id;
        const workflow = this.#workflows.get(mapId);
        if (workflow) {
            workflow.stop();
        }
        // A missing workflow is not an error if all we want to do is stop it.
    }

    reset(map: string | MapModel): void {
        const mapId = typeof map === "string" ? map : map.id;
        const workflow = this.#workflows.get(mapId);
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
        const watchStateHandle = watch(
            () => [workflow.getState()],
            ([newState]) => {
                if (newState === "destroyed") {
                    if (this.#workflows.get(mapId) === workflow) {
                        this.#workflows.delete(mapId);
                    }
                    watchStateHandle.destroy();
                }
            },
            { dispatch: "sync" }
        );
    }
}
