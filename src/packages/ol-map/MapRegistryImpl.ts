// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { Service, ServiceOptions, ServiceType } from "@open-pioneer/runtime";
import OlMap from "ol/Map";
import { MapModelImpl } from "./ModelImpl";
import { MapConfigProvider, MapModel, MapRegistry } from "./api";
import { createMapModel } from "./createMapModel";

const LOG = createLogger("ol-map:MapRegistry");

interface References {
    providers: ServiceType<"ol-map.MapConfigProvider">[];
}

type ModelJobResult = { kind: "model"; model: MapModelImpl } | { kind: "error"; error: Error };

export class MapRegistryImpl implements Service, MapRegistry {
    #configProviders = new Map<string, MapConfigProvider>();
    #entries = new Map<string, ModelJobResult>();
    #modelCreationJobs = new Map<string, Promise<ModelJobResult>>();
    #modelsByOlMap = new WeakMap<OlMap, MapModel>();
    #destroyed = false;

    constructor(options: ServiceOptions<References>) {
        const providers = options.references.providers;
        for (const provider of providers) {
            this.#configProviders.set(provider.mapId, provider);
        }
    }

    destroy(): void {
        if (this.#destroyed) {
            return;
        }

        LOG.info(`Destroy map registry and all maps`);
        this.#destroyed = true;
        this.#entries.forEach((model) => {
            model instanceof MapModelImpl && model.destroy();
        });
        this.#entries.clear();
        this.#modelCreationJobs.clear();
    }

    async getMapModel(mapId: string): Promise<MapModel | undefined> {
        if (this.#destroyed) {
            throw new Error("MapRegistry has already been destroyed.");
        }

        const creationJob = this.#modelCreationJobs.get(mapId);
        if (creationJob) {
            return unbox(await creationJob);
        }

        const entry = this.#entries.get(mapId);
        if (entry) {
            return unbox(entry);
        }

        const provider = this.#configProviders.get(mapId);
        if (!provider) {
            LOG.debug(`Failed to find a config provider for map id '${mapId}'.`);
            return undefined;
        }

        const modelPromise = this.#createModel(mapId, provider).catch((cause) => {
            const error = new Error(`Failed to construct map '${mapId}'`, { cause });
            const entry: ModelJobResult = { kind: "error", error };
            this.#modelCreationJobs.delete(mapId);
            this.#entries.set(mapId, entry);
            return entry;
        });
        this.#modelCreationJobs.set(mapId, modelPromise);
        return unbox(await modelPromise);
    }

    async expectMapModel(mapId: string): Promise<MapModel> {
        const model = await this.getMapModel(mapId);
        if (!model) {
            throw new Error(`No configuration available for map with id '${mapId}'.`);
        }
        return model;
    }

    getMapByRawInstance(olMap: OlMap): MapModel | undefined {
        return this.#modelsByOlMap.get(olMap);
    }

    async #createModel(mapId: string, provider: MapConfigProvider): Promise<ModelJobResult> {
        LOG.info(`Creating map with id '${mapId}'`);
        const mapConfig = await provider.getMapConfig();
        const mapModel = await createMapModel(mapId, mapConfig);

        if (this.#destroyed) {
            mapModel.destroy();
            throw new Error(`MapRegistry has been destroyed.`);
        }

        const entry: ModelJobResult = { kind: "model", model: mapModel };
        this.#entries.set(mapId, entry);
        this.#modelCreationJobs.delete(mapId);
        this.#modelsByOlMap.set(mapModel.olMap, mapModel);
        return entry;
    }
}

function unbox(entry: ModelJobResult): MapModelImpl {
    if (entry.kind === "error") {
        throw entry.error;
    }
    return entry.model;
}
