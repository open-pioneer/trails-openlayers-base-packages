// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { batch, reactive, reactiveSet } from "@conterra/reactivity-core";
import { createLogger } from "@open-pioneer/core";
import OlBaseLayer from "ol/layer/Base";
import { Layer, LayerCollection, LayerRetrievalOptions } from "../api";
import { AbstractLayer } from "./AbstractLayer";
import { AbstractLayerBase } from "./AbstractLayerBase";
import { MapModelImpl } from "./MapModelImpl";

const LOG = createLogger("map:LayerCollection");

const BASE_LAYER_Z = 0;
const OPERATION_LAYER_INITIAL_Z = 1;

/**
 * Z index for layers that should always be rendered on top of all other layers.
 * Note that this is an internal, unstable property!
 *
 * @internal
 */
export const TOPMOST_LAYER_Z = 9999999;

export class LayerCollectionImpl implements LayerCollection {
    #map: MapModelImpl;

    /** Top level layers (base layers, operational layers). No sublayers. */
    #topLevelLayers = reactiveSet<AbstractLayer>();

    /** Index of _all_ layer instances, including sublayers. */
    #layersById = new Map<string, AbstractLayerBase>();

    /** Reverse index of _all_ layers that have an associated OpenLayers layer. */
    #layersByOlLayer: WeakMap<OlBaseLayer, AbstractLayer> = new WeakMap();

    /** Currently active base layer. */
    #activeBaseLayer = reactive<AbstractLayer>();

    /** next z-index for operational layer. currently just auto-increments. */
    #nextIndex = OPERATION_LAYER_INITIAL_Z;

    constructor(map: MapModelImpl) {
        this.#map = map;
    }

    destroy() {
        // Collection is destroyed together with the map, there is no need to clean up the olMap
        for (const layer of this.#layersById.values()) {
            layer.destroy();
        }
        this.#topLevelLayers.clear();
        this.#layersById.clear();
        this.#activeBaseLayer.value = undefined;
    }

    addLayer(layer: Layer): void {
        if (!isLayerInstance(layer)) {
            throw new Error(
                `Layer is not a valid layer instance. Use one of the classes provided by the map package instead.`
            );
        }

        layer.__attach(this.#map);
        this.#addLayer(layer);
    }

    getBaseLayers(): AbstractLayer[] {
        return this.getAllLayers().filter((layer) => layer.isBaseLayer);
    }

    getActiveBaseLayer(): AbstractLayer | undefined {
        return this.#activeBaseLayer.value;
    }

    activateBaseLayer(id: string | undefined): boolean {
        let newBaseLayer = undefined;
        if (id != null) {
            newBaseLayer = this.#layersById.get(id);
            if (!(newBaseLayer instanceof AbstractLayer)) {
                LOG.warn(`Cannot activate base layer '${id}: layer has an invalid type.'`);
                return false;
            }
            if (!newBaseLayer) {
                LOG.warn(`Cannot activate base layer '${id}': layer is unknown.`);
                return false;
            }
            if (!newBaseLayer.isBaseLayer) {
                LOG.warn(`Cannot activate base layer '${id}': layer is not a base layer.`);
                return false;
            }
        }

        this.#updateBaseLayer(newBaseLayer);
        return true;
    }

    getOperationalLayers(options?: LayerRetrievalOptions): AbstractLayer[] {
        return this.getAllLayers(options).filter((layer) => !layer.isBaseLayer);
    }

    getAllLayers(options?: LayerRetrievalOptions): AbstractLayer[] {
        const layers = Array.from(this.#topLevelLayers.values());
        if (options?.sortByDisplayOrder) {
            sortLayersByDisplayOrder(layers);
        }
        return layers;
    }

    getLayerById(id: string): AbstractLayerBase | undefined {
        return this.#layersById.get(id);
    }

    removeLayerById(id: string): void {
        const model = this.#layersById.get(id);
        if (!model) {
            LOG.isDebug() && LOG.debug(`Cannot remove layer '${id}': layer is unknown.`);
            return;
        }

        this.#removeLayer(model);
    }

    getLayerByRawInstance(layer: OlBaseLayer): Layer | undefined {
        return this.#layersByOlLayer?.get(layer);
    }

    /**
     * Adds the given layer to the map and all relevant indices.
     */
    #addLayer(model: AbstractLayer) {
        this.#indexLayer(model);

        const olLayer = model.olLayer;
        if (model.isBaseLayer) {
            olLayer.setZIndex(BASE_LAYER_Z);
            if (!this.#activeBaseLayer.value && model.visible) {
                this.#updateBaseLayer(model);
            } else {
                model.__setVisible(false);
            }
        } else {
            olLayer.setZIndex(this.#nextIndex++);
            model.__setVisible(model.visible);
        }

        this.#topLevelLayers.add(model);
        this.#map.olMap.addLayer(olLayer);
    }

    /**
     * Removes the given layer from the map and all relevant indices.
     * The layer will be destroyed.
     */
    #removeLayer(model: AbstractLayer | AbstractLayerBase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!this.#topLevelLayers.has(model as any)) {
            LOG.warn(
                `Cannot remove layer '${model.id}': only top level layers can be removed at this time.`
            );
            return;
        }

        if (!(model instanceof AbstractLayer)) {
            throw new Error(
                `Internal error: expected top level layer to be an instance of AbstractLayer.`
            );
        }

        this.#map.olMap.removeLayer(model.olLayer);
        this.#topLevelLayers.delete(model);
        this.#unIndexLayer(model);
        if (this.#activeBaseLayer.value === model) {
            this.#updateBaseLayer(this.getBaseLayers()[0]);
        }
        model.destroy();
    }

    #updateBaseLayer(newBaseLayer: AbstractLayer | undefined) {
        const oldBaseLayer = this.#activeBaseLayer.value;
        if (oldBaseLayer === newBaseLayer) {
            return;
        }

        if (LOG.isDebug()) {
            const getId = (model: AbstractLayer | undefined) => {
                return model ? `'${model.id}'` : undefined;
            };

            LOG.debug(
                `Switching active base layer from ${getId(oldBaseLayer)} to ${getId(newBaseLayer)}`
            );
        }

        batch(() => {
            oldBaseLayer?.__setVisible(false);
            this.#activeBaseLayer.value = newBaseLayer;
            newBaseLayer?.__setVisible(true);
        });
    }

    /**
     * Index the layer and all its children.
     */
    #indexLayer(model: AbstractLayer) {
        // layer id -> layer (or sublayer)
        const registrations: [string, OlBaseLayer | undefined][] = [];
        const visit = (model: AbstractLayer | AbstractLayerBase) => {
            const id = model.id;
            const olLayer = "olLayer" in model ? model.olLayer : undefined;
            if (this.#layersById.has(id)) {
                throw new Error(
                    `Layer id '${id}' is not unique. Either assign a unique id yourself ` +
                        `or skip configuring 'id' for an automatically generated id.`
                );
            }
            if (olLayer && this.#layersByOlLayer.has(olLayer)) {
                throw new Error(`OlLayer has already been used in this or another layer.`);
            }

            // Register this layer with the maps.
            this.#layersById.set(id, model);
            if (olLayer) {
                this.#layersByOlLayer.set(olLayer, model as AbstractLayer);
            }
            registrations.push([id, olLayer]);

            // Recurse into nested sublayers.
            for (const sublayer of model.sublayers?.__getRawSublayers() ?? []) {
                visit(sublayer);
            }
        };

        try {
            visit(model);
        } catch (e) {
            for (const [id, olLayer] of registrations) {
                this.#layersById.delete(id);
                if (olLayer) {
                    this.#layersByOlLayer.delete(olLayer);
                }
            }
            throw e;
        }
    }

    /**
     * Removes index entries for the given layer and all its sublayers.
     */
    #unIndexLayer(model: AbstractLayer) {
        const visit = (model: AbstractLayer | AbstractLayerBase) => {
            if ("olLayer" in model) {
                this.#layersByOlLayer.delete(model.olLayer);
            }
            this.#layersById.delete(model.id);
            for (const sublayer of model.sublayers?.__getRawSublayers() ?? []) {
                visit(sublayer);
            }
        };
        visit(model);
    }
}

function sortLayersByDisplayOrder(layers: Layer[]) {
    layers.sort((left, right) => {
        // currently layers are added with increasing z-index (base layers: 0), so
        // ordering by z-index is automatically the correct display order.
        // we use the id as the tie breaker for equal z-indices.
        const leftZ = left.olLayer.getZIndex() ?? 1;
        const rightZ = right.olLayer.getZIndex() ?? 1;
        if (leftZ !== rightZ) {
            return leftZ - rightZ;
        }
        return left.id.localeCompare(right.id, "en");
    });
}

function isLayerInstance(object: unknown): object is AbstractLayer {
    return object instanceof AbstractLayer;
}
