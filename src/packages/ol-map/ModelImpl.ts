// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, createLogger } from "@open-pioneer/core";
import {
    ExtentConfig,
    LayerCollection,
    LayerCollectionEvents,
    LayerConfig,
    LayerLoadState,
    LayerModel,
    LayerModelEvents,
    MapModel,
    MapModelEvents
} from "./api";
import OlMap from "ol/Map";
import OlBaseLayer from "ol/layer/Base";
import { v4 as uuid4v } from "uuid";

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
        this.#layers.destroy();
        this.#olMap.dispose();
    }

    get id(): string {
        return this.#id;
    }

    get olMap(): OlMap {
        return this.#olMap;
    }

    get layers(): LayerCollectionImpl {
        return this.#layers;
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

export class LayerCollectionImpl
    extends EventEmitter<LayerCollectionEvents>
    implements LayerCollection
{
    #map: MapModelImpl;
    #layerModelsById = new Map<string, LayerModelImpl>();
    #layerModelsByLayer: WeakMap<OlBaseLayer, LayerModelImpl> | undefined = undefined;
    #activeBaseLayer: LayerModelImpl | undefined;

    constructor(map: MapModelImpl) {
        super();
        this.#map = map;
    }

    get map(): MapModel {
        return this.#map;
    }

    destroy() {
        // Collection is destroyed together with the map, there is no need to clean up the olMap
        for (const layerModel of this.#layerModelsById.values()) {
            layerModel.destroy();
        }
        this.#layerModelsById.clear();
        this.#layerModelsByLayer = undefined;
        this.#activeBaseLayer = undefined;
    }

    createLayer(config: LayerConfig): LayerModelImpl {
        LOG.debug(`Creating layer`, config);

        const resolvedConfig: Required<LayerConfig> = {
            id: this.#getLayerId(config.id),
            layer: config.layer,
            attributes: config.attributes ?? {},
            title: config.title ?? "",
            description: config.description ?? "",
            isBaseLayer: config.isBaseLayer ?? false
        };
        const model = new LayerModelImpl(this.#map, resolvedConfig);
        try {
            this.#registerLayer(model);

            LOG.debug("Created layer model", model);
            return model;
        } catch (e) {
            model.destroy();
            throw e;
        }
    }

    #registerLayer(model: LayerModelImpl) {
        const id = model.id;
        const olLayer = model.olLayer;
        if (this.#layerModelsById.has(id)) {
            throw new Error(`Layer with id '${id}' is already registered.`);
        }
        if (this.#layerModelsByLayer?.has(olLayer)) {
            throw new Error(`OlLayer has already been used for a different LayerModel.`);
        }

        this.#map.olMap.addLayer(olLayer);
        this.#layerModelsById.set(id, model);
        (this.#layerModelsByLayer ??= new WeakMap()).set(olLayer, model);
        this.emit("changed");
    }

    #getLayerId(id: string | undefined): string {
        if (id != null) {
            if (this.#layerModelsById.has(id)) {
                throw new Error(
                    `Layer id '${id}' is not unique. Either assign a unique id or skip the id property to generate an automatic id.`
                );
            }
            return id;
        }

        return uuid4v();
    }

    getBaseLayers(): LayerModelImpl[] {
        return this.getAllLayers().filter((layerModel) => layerModel.isBaseLayer);
    }

    getActiveBaseLayer(): LayerModelImpl | undefined {
        return this.#activeBaseLayer;
    }

    activateBaseLayer(id: string): boolean {
        const newBaseLayer = this.#layerModelsById.get(id);
        if (!newBaseLayer) {
            LOG.warn(`Cannot activate base layer '${id}': layer is unknown.`);
            return false;
        }
        if (!newBaseLayer.isBaseLayer) {
            LOG.warn(`Cannot activate base layer '${id}': layer is not a base layer.`);
            return false;
        }

        this.#updateBaseLayer(newBaseLayer);
        this.emit("changed");
        return true;
    }

    getOperationalLayers(): LayerModelImpl[] {
        return this.getAllLayers().filter((layerModel) => !layerModel.isBaseLayer);
    }

    getLayerById(id: string): LayerModelImpl | undefined {
        return this.#layerModelsById.get(id);
    }

    getAllLayers(): LayerModelImpl[] {
        return Array.from(this.#layerModelsById.values());
    }

    removeLayerById(id: string): void {
        const model = this.#layerModelsById.get(id);
        if (!model) {
            LOG.isDebug() && LOG.debug(`Cannot remove layer '${id}': layer is unknown.`);
            return;
        }

        this.#map.olMap.removeLayer(model.olLayer);
        this.#layerModelsById.delete(id);
        this.#layerModelsByLayer?.delete(model.olLayer);
        if (this.#activeBaseLayer === model) {
            this.#updateBaseLayer(this.getBaseLayers()[0]);
        }
        model.destroy();
        this.emit("changed");
    }

    getLayerByRawInstance(layer: OlBaseLayer): LayerModel | undefined {
        return this.#layerModelsByLayer?.get(layer);
    }

    #updateBaseLayer(model: LayerModelImpl | undefined) {
        if (this.#activeBaseLayer === model) {
            return;
        }

        this.#activeBaseLayer?.olLayer.setVisible(false);
        this.#activeBaseLayer = model;
        this.#activeBaseLayer?.olLayer.setVisible(true);
    }
}

export class LayerModelImpl extends EventEmitter<LayerModelEvents> implements LayerModel {
    #id: string;
    #map: MapModelImpl;
    #olLayer: OlBaseLayer;
    #isBaseLayer: boolean;
    #attributes: Record<string | symbol, unknown>;

    #title: string;
    #description: string;

    #loadState: LayerLoadState;
    #loadError: Error | undefined;

    constructor(map: MapModelImpl, config: Required<LayerConfig>) {
        super();
        this.#id = config.id;
        this.#map = map;
        this.#olLayer = config.layer;
        this.#isBaseLayer = config.isBaseLayer;
        this.#attributes = config.attributes;
        this.#title = config.title;
        this.#description = config.description;

        // TODO: Initialize state, if possible, from layer and watch for error events
        // Otherwise, if not possible (e.g. for certain layer types), just assume "loaded"
        // hint: layer.source.state, or error events?
        this.#loadState = "not-loaded";
        this.#loadError = undefined;
    }

    get id(): string {
        return this.#id;
    }

    get map(): MapModel {
        return this.#map;
    }

    get olLayer(): OlBaseLayer {
        return this.#olLayer;
    }

    get isBaseLayer(): boolean {
        return this.#isBaseLayer;
    }

    get attributes(): Record<string | symbol, unknown> {
        return this.#attributes;
    }

    get title(): string {
        return this.#title;
    }

    get description(): string {
        return this.#description;
    }

    get loadState(): LayerLoadState {
        return this.#loadState;
    }

    get loadError(): Error | undefined {
        return this.#loadError;
    }

    destroy() {
        this.olLayer.dispose();
    }

    setTitle(newTitle: string): void {
        if (newTitle !== this.#title) {
            this.#title = newTitle;
            this.#emitChangeEvent("changed:title");
        }
    }

    setDescription(newDescription: string): void {
        if (newDescription !== this.#description) {
            this.#description = newDescription;
            this.#emitChangeEvent("changed:description");
        }
    }

    updateAttributes(newAttributes: Record<string | symbol, unknown>): void {
        const attributes = this.#attributes;
        const keys = Reflect.ownKeys(newAttributes);

        let changed = false;
        for (const key of keys) {
            const existing = attributes[key];
            const value = newAttributes[key];
            if (existing !== value) {
                attributes[key] = value;
                changed = true;
            }
        }

        if (changed) {
            this.#emitChangeEvent("changed:attributes");
        }
    }

    #emitChangeEvent<Name extends keyof LayerModelEvents>(event: Name) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).emit(event);
        this.emit("changed");
    }
}
