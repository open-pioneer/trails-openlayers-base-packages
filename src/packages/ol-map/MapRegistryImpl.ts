// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { Service, ServiceOptions, ServiceType } from "@open-pioneer/runtime";
import OlMap from "ol/Map";
import { MapConfigProvider, MapModel, MapRegistry } from "./api";
import { MapModelImpl } from "./ModelImpl";
import { createMapModel } from "./createMapModel";

const LOG = createLogger("ol-map:MapRegistry");

interface References {
    providers: ServiceType<"ol-map.MapConfigProvider">[];
}

export class MapRegistryImpl implements Service, MapRegistry {
    private configProviders = new Map<string, MapConfigProvider>();
    private models = new Map<string, MapModelImpl>();
    private modelCreations = new Map<string, Promise<MapModelImpl | undefined>>();
    private destroyed = false;

    constructor(options: ServiceOptions<References>) {
        const providers = options.references.providers;
        for (const provider of providers) {
            this.configProviders.set(provider.mapId, provider);
        }
    }

    destroy(): void {
        if (this.destroyed) {
            return;
        }

        LOG.info(`Destroy map registry and all maps`);
        this.destroyed = true;
        this.models.forEach((model) => {
            model.destroy();
        });
        this.models.clear();
        this.modelCreations.clear();
    }

    async getMapModel(mapId: string): Promise<MapModel | undefined> {
        if (this.destroyed) {
            throw new Error("MapRegistry has already been destroyed.");
        }

        const existingCreation = this.modelCreations.get(mapId);
        if (existingCreation) {
            return existingCreation;
        }

        const model = this.models.get(mapId);
        if (model) {
            return model;
        }

        const provider = this.configProviders.get(mapId);
        if (!provider) {
            LOG.debug(`Failed to find a config provider for map id '${mapId}'.`);
            return undefined;
        }

        const modelPromise = this.#createModel(mapId, provider).catch((error) => {
            LOG.error(`Failed to construct map '${mapId}'`, error);
            this.modelCreations.delete(mapId);
            return undefined; // TODO: Log or throw?
        });
        this.modelCreations.set(mapId, modelPromise);
        return modelPromise;
    }

    async getOlMap(mapId: string): Promise<OlMap | undefined> {
        const map = await this.getMapModel(mapId);
        return map?.olMap;
    }

    async #createModel(
        mapId: string,
        provider: MapConfigProvider
    ): Promise<MapModelImpl | undefined> {
        LOG.info(`Creating map with id '${mapId}'`);
        const mapConfig = await provider.getMapConfig();
        const mapModel = await createMapModel(mapId, mapConfig);

        if (this.destroyed) {
            mapModel.destroy();
            throw new Error(`MapRegistry has been destroyed.`);
        }

        this.models.set(mapId, mapModel);
        this.modelCreations.delete(mapId);
        return mapModel;
    }
}
