// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, Resource } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import {
    DECLARE_SERVICE_INTERFACE,
    PackageIntl,
    Service,
    ServiceOptions
} from "@open-pioneer/runtime";
import OlMap from "ol/Map";
import { LayerFactory } from "./LayerFactory";
import { createMapModel } from "./model/createMapModel";
import { MapConfig } from "./model/MapConfig";
import { MapModel } from "./model/MapModel";
import { MapModelImpl } from "./model/MapModelImpl";

const LOG = createLogger("map:MapRegistry");

/**
 * Options passed to the {@link MapConfigProvider.getMapConfig} method.
 */
export interface MapConfigProviderOptions {
    /**
     * A reference to the layer factory, for the construction of new layer instances.
     */
    layerFactory: LayerFactory;
}

/**
 * Provides an OpenLayers map configuration with a given map id.
 *
 * The implementor must also provide the interface name `"map.MapConfigProvider"`.
 */
export interface MapConfigProvider {
    /**
     * Unique identifier of the map.
     */
    readonly mapId: string;

    /**
     * Returns the map configuration for this map.
     *
     * Called by the {@link MapRegistry} when the map is requested for the first time.
     *
     * See {@link MapConfig} for supported options during map creation.
     * Use {@link MapConfigProviderOptions.layerFactory} to construct new layers.
     */
    getMapConfig(options: MapConfigProviderOptions): Promise<MapConfig>;
}

interface References {
    providers: MapConfigProvider[];
    httpService: HttpService;
    layerFactory: LayerFactory;
}

type ModelJobResult =
    | { kind: "model"; model: MapModelImpl; listener: Resource }
    | { kind: "error"; error: Error };

/**
 * Provides access to registered map instances.
 *
 * Maps are identified by a unique id.
 *
 * Inject an instance of this service by referencing the interface name `"map.MapRegistry"`.
 */
export class MapRegistry implements Service {
    declare [DECLARE_SERVICE_INTERFACE]: "map.MapRegistry";

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

    /**
     * Returns the map model associated with the given id.
     * Returns undefined if there is no such model.
     */
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

    /**
     * Like {@link getMapModel}, but throws if no model exists for the given `mapId`.
     */
    async expectMapModel(mapId: string): Promise<MapModel> {
        const model = await this.getMapModel(mapId);
        if (!model) {
            throw new Error(`No configuration available for map with id '${mapId}'.`);
        }
        return model;
    }

    /**
     * Creates a MapModel without the need to provide a {@link MapConfigProvider}.
     * Throws an error if a map with the given id already exists or if the map config is invalid.
     */
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

    /**
     * Given a raw OpenLayers map instance, returns the associated {@link MapModel} - or undefined
     * if the map is unknown to this registry.
     *
     * All OpenLayers maps created by this registry (e.g. via {@link MapConfigProvider} or {@link createMapModel}) have an associated map model.
     */
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
