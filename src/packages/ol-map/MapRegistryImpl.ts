// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, createLogger } from "@open-pioneer/core";
import { Service, ServiceOptions, ServiceType } from "@open-pioneer/runtime";
import OlMap, { MapOptions } from "ol/Map";
import {
    ExtentConfig,
    LayerCollection,
    MapConfigProvider,
    MapModel,
    MapModelEvents,
    MapRegistry
} from "./api";
import View from "ol/View";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import { Attribution } from "ol/control";

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

        const modelPromise = this.createModel(mapId, provider);
        this.modelCreations.set(mapId, modelPromise);
        return modelPromise;
    }

    async getOlMap(mapId: string): Promise<OlMap | undefined> {
        const map = await this.getMapModel(mapId);
        return map?.olMap;
    }

    private async createModel(
        mapId: string,
        provider: MapConfigProvider
    ): Promise<MapModelImpl | undefined> {
        LOG.info(`Creating map with id '${mapId}'`);

        const mapConfig = (await provider.getMapConfig()) ?? {};
        const mapOptions: MapOptions = {
            ...mapConfig.advanced
        };
        if (!mapOptions.controls) {
            mapOptions.controls = [new Attribution()];
        }
        if (!mapOptions.view) {
            mapOptions.view = Promise.resolve({
                projection: "EPSG:3857",
                center: [0, 0],
                zoom: 1
            });
        }
        if (!mapOptions.layers) {
            mapOptions.layers = [
                new TileLayer({ source: new OSM(), properties: { title: "OSM" } })
            ];
        }

        if (mapConfig.projection) {
            const viewOrViewOptions = await mapOptions.view;
            if (viewOrViewOptions instanceof View) {
                LOG.warn(
                    `The advanced configuration for map id '${mapId}' has provided a fully constructed view instance: the custom projection cannot be applied.\n` +
                        `Use ViewOptions instead of a View instance.`
                );
            } else {
                viewOrViewOptions.projection = mapConfig.projection as string; // TODO
            }
        }

        if (this.destroyed) {
            throw new Error(`MapRegistry has been destroyed.`);
        }

        LOG.debug(`Constructing open layers map with options`, mapOptions);
        const olMap = new OlMap(mapOptions);
        const mapModel = new MapModelImpl({
            id: mapId,
            olMap
        });

        this.models.set(mapId, mapModel);
        this.modelCreations.delete(mapId);
        return mapModel;
    }
}

export class MapModelImpl extends EventEmitter<MapModelEvents> implements MapModel {
    readonly #id: string;
    readonly #olMap: OlMap;
    readonly #layers: undefined; // TODO LayerCollection
    #container: HTMLDivElement | undefined;
    #initialExtent: ExtentConfig | undefined; // TODO different type?

    constructor(properties: { id: string; olMap: OlMap }) {
        super();
        this.#id = properties.id;
        this.#olMap = properties.olMap;
    }

    destroy() {
        this.#olMap.dispose();
    }

    get id(): string {
        return this.#id;
    }

    get olMap(): OlMap {
        return this.#olMap;
    }

    get layers(): LayerCollection {
        throw new Error("not implemented");
    }

    get container(): HTMLDivElement | undefined {
        return this.#container;
    }

    get initialExtent(): ExtentConfig | undefined {
        return this.#initialExtent;
    }

    whenDisplayed(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    // Called by the UI implementation when the map is mounted
    __setContainer(container: HTMLDivElement | undefined): void {
        if (container !== this.#container) {
            this.#container = container;
            this.emit("changed:container");
            this.emit("changed");
        }
    }
}
