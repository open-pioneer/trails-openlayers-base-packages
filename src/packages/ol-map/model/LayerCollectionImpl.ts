// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, createLogger } from "@open-pioneer/core";
import OlBaseLayer from "ol/layer/Base";
import { v4 as uuid4v } from "uuid";
import { LayerCollection, LayerCollectionEvents, LayerConfig, LayerModel, MapModel } from "../api";
import { LayerModelImpl } from "./LayerModelImpl";
import { MapModelImpl } from "./MapModelImpl";

const LOG = createLogger("ol-map:LayerCollection");

export class LayerCollectionImpl
    extends EventEmitter<LayerCollectionEvents>
    implements LayerCollection
{
    #map: MapModelImpl;
    #layerModelsById = new Map<string, LayerModelImpl>();
    #layerModelsByLayer: WeakMap<OlBaseLayer, LayerModelImpl> | undefined = undefined;
    #activeBaseLayer: LayerModelImpl | undefined;
    #nextIndex = 1; // next z-index for a layer. currently just auto-increments.

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

        const model = new LayerModelImpl(this.#map, {
            id: this.#generateLayerId(config.id),
            layer: config.layer,
            attributes: config.attributes ?? {},
            title: config.title ?? "",
            description: config.description ?? "",
            visible: config.visible ?? true,
            isBaseLayer: config.isBaseLayer ?? false
        });
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

        if (model.isBaseLayer) {
            olLayer.setZIndex(0);
            if (!this.#activeBaseLayer && model.visible) {
                this.#updateBaseLayer(model);
            } else {
                model.__setVisible(false);
            }
        } else {
            olLayer.setZIndex(this.#nextIndex++);
            model.__setVisible(model.visible);
        }

        this.#map.olMap.addLayer(olLayer);
        this.#layerModelsById.set(id, model);
        (this.#layerModelsByLayer ??= new WeakMap()).set(olLayer, model);
        this.emit("changed");
    }

    #generateLayerId(id: string | undefined): string {
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

        if (LOG.isDebug()) {
            const getId = (model: LayerModelImpl | undefined) => {
                return model ? `'${model.id}'` : undefined;
            };

            LOG.debug(
                `Switching active base layer from ${getId(this.#activeBaseLayer)} to ${getId(
                    model
                )}`
            );
        }
        this.#activeBaseLayer?.__setVisible(false);
        this.#activeBaseLayer = model;
        this.#activeBaseLayer?.__setVisible(true);
    }
}
