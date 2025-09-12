// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, Resource } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { PackageIntl, Service, ServiceOptions } from "@open-pioneer/runtime";
import OlMap from "ol/Map";
import { MapConfig, MapConfigProvider, MapModel, MapRegistry } from "./api";
import { createMapModel } from "./model/createMapModel";
import { MapModelImpl } from "./model/MapModelImpl";
import { LayerFactory } from "./model/layers/LayerFactory";

const LOG = createLogger("map:MapRegistry");

interface References {
    providers: MapConfigProvider[];
    httpService: HttpService;
    layerFactory: LayerFactory;
}

type ModelJobResult =
    | { kind: "model"; model: MapModelImpl; listener: Resource }
    | { kind: "error"; error: Error };

export class MapRegistryImpl implements Service, MapRegistry {
    #intl: PackageIntl;
    #httpService: HttpService;
    #layerFactory: LayerFactory;

    #configProviders = new Map<string, MapConfigProvider>();
    #entries = new Map<string, ModelJobResult>();
    #modelCreationJobs = new Map<string, Promise<ModelJobResult>>();
    #modelsByOlMap = new WeakMap<OlMap, MapModel>();
    #destroyed = false;

    constructor({ references, intl }: ServiceOptions<References>) {
        this.#intl = intl;
        this.#httpService = references.httpService;
        this.#layerFactory = references.layerFactory;

        const providers = references.providers;
        for (const provider of providers) {
            this.#configProviders.set(provider.mapId, provider);
        }
    }

    destroy(): void {
        if (this.#destroyed) {
            return;
        }

        LOG.debug(`Destroy map registry and all maps`);
        this.#destroyed = true;
        this.#entries.forEach((entry) => {
            if (entry.kind === "model") {
                entry.listener.destroy();
                entry.model.destroy();
            }
        });
        this.#entries.clear();
        this.#modelCreationJobs.clear();
    }

    async getMapModel(mapId: string): Promise<MapModel | undefined> {
        if (this.#destroyed) {
            throw new Error("MapRegistry has already been destroyed.");
        }

        const entry = this.#entries.get(mapId);
        if (entry) {
            return unbox(entry);
        }

        const creationJob = this.#modelCreationJobs.get(mapId);
        if (creationJob) {
            return await waitForResult(creationJob);
        }

        const provider = this.#configProviders.get(mapId);
        if (!provider) {
            LOG.debug(`Failed to find a config provider for map id '${mapId}'.`);
            return undefined;
        }

        return await this.#createMapModel(mapId, () =>
            provider.getMapConfig({
                layerFactory: this.#layerFactory
            })
        );
    }

    async expectMapModel(mapId: string): Promise<MapModel> {
        const model = await this.getMapModel(mapId);
        if (!model) {
            throw new Error(`No configuration available for map with id '${mapId}'.`);
        }
        return model;
    }

    async createMapModel(mapId: string, options?: MapConfig): Promise<MapModel> {
        if (this.#destroyed) {
            throw new Error("MapRegistry has already been destroyed.");
        }
        if (this.#entries.has(mapId)) {
            throw new Error(`Map id '${mapId}' is not unique.`);
        }
        if (this.#modelCreationJobs.has(mapId)) {
            throw new Error(`A map with the id '${mapId}' is already under construction.`);
        }
        return await this.#createMapModel(mapId, () => Promise.resolve(options ?? {}));
    }

    getMapModelByRawInstance(olMap: OlMap): MapModel | undefined {
        return this.#modelsByOlMap.get(olMap);
    }

    // Wrapper method to ensure that in-progress construction of maps can be observed.
    #createMapModel(
        mapId: string,
        configProvider: () => Promise<MapConfig>
    ): Promise<MapModelImpl> {
        const creationJob = this.#modelCreationJobs.get(mapId);
        if (creationJob) {
            throw new Error("Internal error: a map model is already being created for this mapId");
        }

        const modelPromise = this.#createMapModelImpl(mapId, configProvider)
            .then((mapModel) => {
                if (this.#destroyed) {
                    mapModel.destroy();
                    throw new Error(`MapRegistry has been destroyed.`);
                }

                const listener = mapModel.on("destroy", () => {
                    // Allow id reuse for dynamically created maps
                    if (this.#isDynamic(mapId)) {
                        const currentEntry = this.#entries.get(mapId);
                        if (currentEntry === entry) {
                            this.#entries.delete(mapId);
                        }
                    }
                });

                const entry: ModelJobResult = { kind: "model", model: mapModel, listener };
                this.#entries.set(mapId, entry);
                this.#modelCreationJobs.delete(mapId);
                this.#modelsByOlMap.set(mapModel.olMap, mapModel);
                return entry;
            })
            .catch((cause) => {
                const error = new Error(`Failed to construct map '${mapId}'`, { cause });
                const entry: ModelJobResult = { kind: "error", error };
                this.#modelCreationJobs.delete(mapId);
                if (!this.#isDynamic(mapId)) {
                    // Don't store errors for dynamically created maps (the caller already got the error via promise).
                    this.#entries.set(mapId, entry);
                }
                return entry;
            });
        this.#modelCreationJobs.set(mapId, modelPromise);
        return waitForResult(modelPromise);
    }

    async #createMapModelImpl(
        mapId: string,
        configProvider: () => Promise<MapConfig>
    ): Promise<MapModelImpl> {
        LOG.info(`Creating map with id '${mapId}'`);
        const mapConfig = await configProvider();
        const mapModel = await createMapModel(mapId, mapConfig, this.#intl, this.#httpService);
        return mapModel;
    }

    #isDynamic(mapId: string): boolean {
        return !this.#configProviders.has(mapId);
    }
}

async function waitForResult(job: Promise<ModelJobResult>): Promise<MapModelImpl> {
    return unbox(await job);
}

function unbox(entry: ModelJobResult): MapModelImpl {
    if (entry.kind === "error") {
        throw entry.error;
    }
    return entry.model;
}
