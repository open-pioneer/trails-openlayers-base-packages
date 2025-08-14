// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    batch,
    effect,
    reactive,
    reactiveArray,
    reactiveMap,
    reactiveSet
} from "@conterra/reactivity-core";
import { createLogger, Resource } from "@open-pioneer/core";
import OlBaseLayer from "ol/layer/Base";
import {
    AddLayerOptions,
    AnyLayer,
    Layer,
    LayerCollection,
    LayerRetrievalOptions,
    Sublayer
} from "../api";
import { AbstractLayer } from "./AbstractLayer";
import { AbstractLayerBase } from "./AbstractLayerBase";
import { MapModelImpl } from "./MapModelImpl";
import { getRecursiveLayers } from "./getRecursiveLayers";

const LOG = createLogger("map:LayerCollection");

type LayerType = AbstractLayer & Layer;
type LayerBaseType = (AbstractLayerBase & Layer) | (AbstractLayerBase & Sublayer);

/**
 * Z index for layers that should always be rendered on top of all other layers.
 * Note that this is an internal, unstable property!
 *
 * @internal
 */
export const TOPMOST_LAYER_Z = 9999999;

/**
 * Manages the (top-level) content of the map.
 */
export class LayerCollectionImpl implements LayerCollection {
    #map: MapModelImpl;

    /** Top level layers (base layers, operational layers). No sublayers. */
    #topLevelLayers = reactiveSet<LayerType>();

    /** Index of _all_ layer instances, including sublayers. */
    #layersById = reactiveMap<string, LayerBaseType>();

    /** Reverse index of _all_ layers that have an associated OpenLayers layer. */
    #layersByOlLayer: WeakMap<OlBaseLayer, LayerType> = new WeakMap();

    /** Currently active base layer. */
    #activeBaseLayer = reactive<LayerType>();

    /**
     * Defines the relative order of operational layers.
     * Lower index -> layer is below its successors.
     * Excluding {@link #topMostOperationalLayers}
     */
    #operationalLayerOrder = reactiveArray<LayerType>();

    /** Operational layers that are always displayed at the top above all other layers (e.g. a highlight layer) */
    #topMostOperationalLayers = reactiveArray<LayerType>();

    #syncHandle: Resource | undefined;

    constructor(map: MapModelImpl) {
        this.#map = map;
        this.#syncHandle = effect(() => {
            const orderedLayers = this.getLayers({ sortByDisplayOrder: true }); //topmost layers are already add the end of the list if sortByDisplayOrder is true

            // Simply reassign all z-indices whenever the order changes.
            let index = 0;
            for (const layer of orderedLayers) {
                LOG.isDebug() && LOG.debug("Assigning z-index", layer.id, index);
                layer.olLayer.setZIndex(index);
                index++;
            }
        });
    }

    destroy() {
        // Collection is destroyed together with the map, there is no need to clean up the olMap
        for (const layer of this.#layersById.values()) {
            layer.destroy();
        }
        this.#topLevelLayers.clear();
        this.#layersById.clear();
        this.#operationalLayerOrder.splice(0, this.#operationalLayerOrder.length);
        this.#activeBaseLayer.value = undefined;
        this.#syncHandle?.destroy();
        this.#syncHandle = undefined;
    }

    addLayer(layer: Layer, options?: AddLayerOptions): void {
        checkLayerInstance(layer);

        layer.__attachToMap(this.#map);
        this.#addLayer(layer, options);
    }

    getBaseLayers(): Layer[] {
        // Slightly inefficient, but we don't need a separate index for base layers right now.
        return Array.from(this.#topLevelLayers).filter((layer) => layer.isBaseLayer);
    }

    getActiveBaseLayer(): Layer | undefined {
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

    getOperationalLayers(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options).filter((layer) => !layer.isBaseLayer);
    }

    getItems(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options);
    }

    getLayers(options?: LayerRetrievalOptions): Layer[] {
        if (options?.sortByDisplayOrder) {
            const baseLayers = this.getBaseLayers();
            const order = Array.from(this.#operationalLayerOrder);
            const topMost = Array.from(this.#topMostOperationalLayers);
            return [...baseLayers, ...order, ...topMost];
        } else {
            return Array.from(this.#topLevelLayers.values());
        }
    }

    getAllLayers(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options);
    }

    getRecursiveLayers({
        filter,
        sortByDisplayOrder
    }: LayerRetrievalOptions & {
        filter?: "base" | "operational" | ((layer: AnyLayer) => boolean);
    } = {}): AnyLayer[] {
        let filterFunc;
        if (typeof filter === "function") {
            filterFunc = filter;
        } else if (typeof filter === "string") {
            const filterType = filter;
            const topLevelFilter = (layer: Layer) => {
                return filterType === "base" ? layer.isBaseLayer : !layer.isBaseLayer;
            };
            filterFunc = (layer: AnyLayer) => {
                if (!layer.parent && "isBaseLayer" in layer) {
                    return topLevelFilter(layer);
                }
                // For nested children, include them all.
                return true;
            };
        }

        return getRecursiveLayers({
            from: this,
            filter: filterFunc,
            sortByDisplayOrder
        });
    }

    getLayerById(id: string): AnyLayer | undefined {
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
    #addLayer(model: LayerType, options: AddLayerOptions | undefined) {
        // Throws; do this before manipulating the data structures
        const operationalLayerIndex = this.#getInsertionIndex(model, options);
        const isTopMostLayer = options?.at === "topmost";
        this.#indexLayer(model);

        // Everything below this line should not fail.
        if (model.isBaseLayer) {
            if (!this.#activeBaseLayer.value && model.visible) {
                this.#updateBaseLayer(model);
            } else {
                model.__setVisible(false);
            }
        } else {
            model.__setVisible(model.visible);

            if (operationalLayerIndex == null) {
                throw new Error(
                    "Internal error: insertion index is undefined for operational layer."
                );
            }

            const layerList = isTopMostLayer
                ? this.#topMostOperationalLayers
                : this.#operationalLayerOrder;
            layerList.splice(operationalLayerIndex, 0, model); //insert new layer at insertion index
        }

        this.#topLevelLayers.add(model);
        this.#map.olMap.addLayer(model.olLayer);
    }

    #getInsertionIndex(model: LayerType, options: AddLayerOptions | undefined): number | undefined {
        if (model.isBaseLayer) {
            if (options?.at) {
                throw new Error(
                    `Cannot add base layer '${model.id}' at a specific position: only operational layers can be added at a specific position.`
                );
            }
            return undefined;
        }

        switch (options?.at) {
            case undefined:
            case null:
            case "top":
                return this.#operationalLayerOrder.length;
            case "topmost":
                return this.#topMostOperationalLayers.length;
            case "bottom":
                return 0;
            case "above":
            case "below": {
                const reference = this.#getReference(options.reference);
                let index = this.#operationalLayerOrder.indexOf(reference);
                if (index === -1) {
                    throw new Error(
                        `Reference layer '${reference.id}' not found in operation layers.`
                    );
                }
                if (options.at === "above") {
                    index++;
                }
                return index;
            }
        }
        assertNever(options);
    }

    #getReference(reference: Layer | string): LayerType {
        let layer: AnyLayer;
        if (typeof reference === "string") {
            const refLayer = this.getLayerById(reference);
            if (!refLayer) {
                throw new Error(`Unknown reference layer '${reference}'.`);
            }
            layer = refLayer;
        } else {
            layer = reference;
        }
        checkLayerInstance(layer);
        return layer;
    }

    /**
     * Removes the given layer from the map and all relevant indices.
     * The layer will be destroyed.
     */
    #removeLayer(model: LayerType | LayerBaseType) {
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

        const isTopMostLayer = this.#topMostOperationalLayers.includes(model);
        this.#map.olMap.removeLayer(model.olLayer);
        this.#topLevelLayers.delete(model);
        if (!model.isBaseLayer) {
            const layerList = isTopMostLayer
                ? this.#topMostOperationalLayers
                : this.#operationalLayerOrder;
            const index = layerList.indexOf(model);
            if (index !== -1) {
                layerList.splice(index, 1);
            }
        }

        this.#unIndexLayer(model);
        if (this.#activeBaseLayer.value === model) {
            const newBaseLayer = this.getBaseLayers()[0];
            if (newBaseLayer) {
                checkLayerInstance(newBaseLayer);
            }
            this.#updateBaseLayer(newBaseLayer);
        }

        model.destroy();
    }

    #updateBaseLayer(model: LayerType | undefined) {
        if (this.#activeBaseLayer.value === model) {
            return;
        }

        if (LOG.isDebug()) {
            const getId = (model: AbstractLayer | undefined) => {
                return model ? `'${model.id}'` : undefined;
            };

            LOG.debug(
                `Switching active base layer from ${getId(this.#activeBaseLayer.value)} to ${getId(model)}`
            );
        }

        batch(() => {
            this.#activeBaseLayer.value?.__setVisible(false);
            this.#activeBaseLayer.value = model;
            model?.__setVisible(true);
        });
    }

    /**
     * Index the layer and all its children.
     */
    #indexLayer(model: LayerType) {
        // layer id -> layer (or sublayer)
        const registrations: [string, OlBaseLayer | undefined][] = [];
        const visit = (model: LayerType | (AbstractLayerBase & Sublayer)) => {
            const id = model.id;
            const olLayer = "olLayer" in model ? model.olLayer : undefined;
            if (this.#layersById.has(id)) {
                throw new Error(
                    `Layer id '${id}' is not unique. Either assign a unique id yourself ` +
                        `or skip configuring 'id' for an automatically generated id.`
                );
            }
            if (olLayer && this.#layersByOlLayer.has(olLayer)) {
                throw new Error(`OlLayer used by layer '${id}' has already been used in map.`);
            }

            // Register this layer with the maps.
            this.#layersById.set(id, model);
            if (olLayer) {
                this.#layersByOlLayer.set(olLayer, model as LayerType); // ol is present --> not a sublayer
            }
            registrations.push([id, olLayer]);

            // Recurse into nested children.
            for (const layer of model.layers?.__getRawLayers() ?? []) {
                visit(layer);
            }
            for (const sublayer of model.sublayers?.__getRawSublayers() ?? []) {
                visit(sublayer);
            }
        };

        try {
            visit(model);
        } catch (e) {
            // If any error happens, undo the indexing.
            // This way we don't leave a partially indexed layer tree behind.
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
     * Removes index entries for the given layer and all its children.
     */
    #unIndexLayer(model: AbstractLayer) {
        const visit = (model: AbstractLayer | AbstractLayerBase) => {
            if ("olLayer" in model) {
                this.#layersByOlLayer.delete(model.olLayer);
            }
            this.#layersById.delete(model.id);

            for (const layer of model.layers?.__getRawLayers() ?? []) {
                visit(layer);
            }

            for (const sublayer of model.sublayers?.__getRawSublayers() ?? []) {
                visit(sublayer);
            }
        };
        visit(model);
    }
}

function checkLayerInstance(object: AnyLayer): asserts object is Layer & AbstractLayer {
    if (!(object instanceof AbstractLayer)) {
        throw new Error(
            `Layer is not a valid layer instance. Use one of the classes provided by the map package instead.`
        );
    }
}

function assertNever(_arg: never): never {
    throw new Error(`Internal error: unhandled option.`);
}
