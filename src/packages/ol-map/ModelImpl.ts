// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, createLogger } from "@open-pioneer/core";
import { ExtentConfig, LayerCollection, LayerCollectionEvents, LayerModel, MapModel, MapModelEvents } from "./api";
import OlMap from "ol/Map";
import OlBaseLayer from "ol/layer/Base";

const LOG = createLogger("ol-map:Model");

export class MapModelImpl extends EventEmitter<MapModelEvents> implements MapModel {
    readonly #id: string;
    readonly #olMap: OlMap;
    readonly #layers = new LayerCollectionImpl(this);
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

export class LayerCollectionImpl extends EventEmitter<LayerCollectionEvents> implements LayerCollection {
    #map: MapModelImpl;
    #layerModelsById = new Map<string, LayerModel>();
    #layerModelsByLayer = new WeakMap<OlBaseLayer, LayerModel>();
    #activeBaseLayer: LayerModel | undefined;

    constructor(map: MapModelImpl) {
        super();
        this.#map = map;
    }

    get map(): MapModel {
        return this.#map;
    }

    // TODO: Cleanup

    // TODO siganture, private?
    registerLayer(model: LayerModel): void {
        const id = model.id;
        const olLayer = model.olLayer;
        if (this.#layerModelsById.has(id)) {
            throw new Error(`Layer with id '${id}' is already registered.`);
        }
        if (this.#layerModelsByLayer.has(olLayer)) {
            throw new Error(`OlLayer has already been used for a different LayerModel.`);
        }

        // TODO: Add to map?
        this.#layerModelsById.set(id, model);
        this.#layerModelsByLayer.set(olLayer, model);
        this.emit("changed");
    }
    
    getBaseLayers(): LayerModel[] {
        return this.getAllLayers().filter(layerModel => layerModel.isBaseLayer);
    }

    getActiveBaseLayer(): LayerModel | undefined {
        return this.#activeBaseLayer;
    }

    activateBaseLayer(id: string): boolean {
        const model = this.#layerModelsById.get(id);
        if (!model)  {
            LOG.warn(`Cannot activate base layer '${id}': layer is unknown.`);
            return false;
        }
        if (!model.isBaseLayer) {
            LOG.warn(`Cannot activate base layer '${id}': layer is not a base layer.`);
            return false;
        }

        this.#updateBaseLayer(model);
        this.emit("changed");
        return true;
    }
    
    getOperationalLayers(): LayerModel[] {
        return this.getAllLayers().filter(layerModel => !layerModel.isBaseLayer);
    }
    
    getLayerById(id: string): LayerModel | undefined {
        return this.#layerModelsById.get(id);
    }
    
    getAllLayers(): LayerModel[] {
        return Array.from(this.#layerModelsById.values());
    }
    
    removeLayerById(id: string): void {
        const model = this.#layerModelsById.get(id);
        if (!model) {
            LOG.isDebug() && LOG.debug(`Cannot remove layer '${id}': layer is unknown.`);
            return;
        }

        // TODO: Remove from map? Destroy olLayer?
        this.#layerModelsById.delete(id);
        this.#layerModelsByLayer.delete(model.olLayer);
        if (this.#activeBaseLayer === model) {
            this.#updateBaseLayer(this.getBaseLayers()[0]);
        }
        this.emit("changed");
    }
    
    getLayerByRawInstance(layer: OlBaseLayer): LayerModel | undefined {
        return this.#layerModelsByLayer.get(layer);
    }

    #updateBaseLayer(model: LayerModel | undefined) {
        if (this.#activeBaseLayer === model) {
            return;
        }

        // TODO: Update map
        this.#activeBaseLayer = model;
    }
}
