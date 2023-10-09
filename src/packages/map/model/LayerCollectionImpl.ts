// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, createLogger } from "@open-pioneer/core";
import OlBaseLayer from "ol/layer/Base";
import { v4 as uuid4v } from "uuid";
import {
    LayerCollection,
    LayerCollectionEvents,
    LayerConfig,
    LayerModel,
    LayerRetrievalOptions
} from "../api";
import { LayerModelImpl } from "./LayerModelImpl";
import { MapModelImpl } from "./MapModelImpl";

const LOG = createLogger("map:LayerCollection");

const BASE_LAYER_Z = 0;
const OPERATION_LAYER_INITIAL_Z = 1;

export class LayerCollectionImpl
    extends EventEmitter<LayerCollectionEvents>
    implements LayerCollection
{
    #map: MapModelImpl;
    #layerModelsById = new Map<string, LayerModelImpl>();
    #layerModelsByLayer: WeakMap<OlBaseLayer, LayerModelImpl> | undefined = undefined;
    #activeBaseLayer: LayerModelImpl | undefined;
    #nextIndex = OPERATION_LAYER_INITIAL_Z; // next z-index for operational layer. currently just auto-increments.

    constructor(map: MapModelImpl) {
        super();
        this.#map = map;
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
            throw new Error(`OlLayer has already been used in this or another LayerModel.`);
        }

        if (model.isBaseLayer) {
            olLayer.setZIndex(BASE_LAYER_Z);
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

    activateBaseLayer(id: string | undefined): boolean {
        let newBaseLayer = undefined;
        if (id != null) {
            newBaseLayer = this.#layerModelsById.get(id);
            if (!newBaseLayer) {
                LOG.warn(`Cannot activate base layer '${id}': layer is unknown.`);
                return false;
            }
            if (!newBaseLayer.isBaseLayer) {
                LOG.warn(`Cannot activate base layer '${id}': layer is not a base layer.`);
                return false;
            }
        }

        if (newBaseLayer !== this.#activeBaseLayer) {
            this.#updateBaseLayer(newBaseLayer);
            this.emit("changed");
        }
        return true;
    }

    getOperationalLayers(options?: LayerRetrievalOptions): LayerModelImpl[] {
        return this.getAllLayers(options).filter((layerModel) => !layerModel.isBaseLayer);
    }

    getLayerById(id: string): LayerModelImpl | undefined {
        return this.#layerModelsById.get(id);
    }

    getAllLayers(options?: LayerRetrievalOptions): LayerModelImpl[] {
        const layers = Array.from(this.#layerModelsById.values());
        if (options?.sortByDisplayOrder) {
            sortLayersByDisplayOrder(layers);
        }
        return layers;
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

function sortLayersByDisplayOrder(layers: LayerModel[]) {
    layers.sort((left, right) => {
        // currently layers are added with increasing z-index (base layers: 0), so
        // ordering by z-index is automatically the correct display order.
        // we use the id as the tie breaker for equal z-indices.
        // TODO: improve handling of layers without an `olLayer` (do not yet exist currently)
        const leftZ = left.olLayer.getZIndex() ?? 1;
        const rightZ = right.olLayer.getZIndex() ?? 1;
        if (leftZ !== rightZ) {
            return leftZ - rightZ;
        }
        return left.id.localeCompare(right.id, "en");
    });
}
