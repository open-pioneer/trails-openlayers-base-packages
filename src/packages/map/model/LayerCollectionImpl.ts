// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    batch,
    effect,
    reactive,
    ReactiveArray,
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

interface OpOrTopmostLayerPos {
    which: "normal" | "topmost";
    index: number;
}

interface BaseLayerPos {
    which: "base";
}

type LayerPos = OpOrTopmostLayerPos | BaseLayerPos;

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
            // Contains base layers, normal operational layers, topmost layers in bottom-to-top order.
            const orderedLayers = this.getLayers({ sortByDisplayOrder: true });

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
        batch(() => {
            checkLayerInstance(layer);

            layer.__attachToMap(this.#map);
            this.#addLayer(layer, options);
        });
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
        batch(() => {
            const model = this.#layersById.get(id);
            if (!model) {
                LOG.isDebug() && LOG.debug(`Cannot remove layer '${id}': layer is unknown.`);
                return;
            }

            checkLayerInstance(model);
            if (!this.#topLevelLayers.has(model)) {
                LOG.warn(
                    `Cannot remove layer '${model.id}': only top level layers can be removed at this time.`
                );
                return;
            }

            this.#removeLayer(model);
            model.destroy();
        });
    }

    removeLayer(layer: string | Layer): Layer | undefined {
        return batch(() => {
            let model;
            if (typeof layer === "string") {
                model = this.#layersById.get(layer);
                if (!model) {
                    return undefined;
                }
            } else {
                model = layer;
            }

            checkLayerInstance(model);
            if (!this.#topLevelLayers.has(model)) {
                return undefined;
            }

            this.#removeLayer(model);
            model.__detachFromMap();
            return model;
        });
    }

    getLayerByRawInstance(layer: OlBaseLayer): Layer | undefined {
        return this.#layersByOlLayer?.get(layer);
    }

    /**
     * Adds the given layer to the map and all relevant indices.
     */
    #addLayer(model: LayerType, options: AddLayerOptions | undefined) {
        // Throws; do this before manipulating the data structures
        const pos = this.#getInsertionPos(model, options);
        this.#indexLayer(model);

        // Everything below this line should not fail.
        if (pos.which === "base") {
            if (!this.#activeBaseLayer.value && model.visible) {
                this.#updateBaseLayer(model);
            } else {
                model.__setVisible(false);
            }
        } else {
            model.__setVisible(model.visible);

            const layerList = this.#getLayerList(pos);
            layerList.splice(pos.index, 0, model); // insert new layer at insertion index
        }
        this.#topLevelLayers.add(model);
        this.#map.olMap.addLayer(model.olLayer);
    }

    #getInsertionPos(model: LayerType, options: AddLayerOptions | undefined): LayerPos {
        if (model.isBaseLayer) {
            if (options?.at) {
                throw new Error(
                    `Cannot add base layer '${model.id}' at a specific position: only operational layers can be added at a specific position.`
                );
            }
            return { which: "base" };
        }

        switch (options?.at) {
            case undefined:
            case null:
            case "top":
                return { which: "normal", index: this.#operationalLayerOrder.length };
            case "topmost":
                return { which: "topmost", index: this.#topMostOperationalLayers.length };
            case "bottom":
                return { which: "normal", index: 0 };
            case "above":
            case "below": {
                const reference = this.#getReference(options.reference);
                const pos = this.#findOpOrTopmost(reference);
                if (!pos) {
                    // reference is not a top level operational layer -> throw error
                    const errorMessage = this.#getInsertErrorMessage(model, reference);
                    throw new Error(errorMessage);
                }

                if (options.at === "above") {
                    pos.index++;
                }
                return pos;
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
     * Removes the given top level layer from the map and all relevant indices.
     */
    #removeLayer(model: LayerType) {
        this.#map.olMap.removeLayer(model.olLayer);
        this.#topLevelLayers.delete(model);
        if (!model.isBaseLayer) {
            const pos = this.#findOpOrTopmost(model)!;
            const layerList = this.#getLayerList(pos);
            layerList.splice(pos.index, 1);
        }

        this.#unIndexLayer(model);
        if (this.#activeBaseLayer.value === model) {
            const newBaseLayer = this.getBaseLayers()[0];
            if (newBaseLayer) {
                checkLayerInstance(newBaseLayer);
            }
            this.#updateBaseLayer(newBaseLayer);
        }
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

            // Register this layer with the map.
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

    #getLayerList(pos: OpOrTopmostLayerPos): ReactiveArray<LayerType> {
        switch (pos.which) {
            case "topmost":
                return this.#topMostOperationalLayers;
            case "normal":
                return this.#operationalLayerOrder;
        }
    }

    #findOpOrTopmost(layer: LayerType): OpOrTopmostLayerPos | undefined {
        let index = this.#operationalLayerOrder.indexOf(layer);
        if (index !== -1) {
            return { which: "normal", index };
        }

        index = this.#topMostOperationalLayers.indexOf(layer);
        if (index !== -1) {
            return { which: "topmost", index };
        }
        return undefined;
    }

    #getInsertErrorMessage(layer: LayerType, reference: LayerType) {
        let message: string = `Cannot add layer '${layer.id}'. Reference layer '${reference.id}' is not a top level operational layer.`;

        if (reference.isBaseLayer) {
            //is base layer
            message += " Reference layer is a base layer.";
        } else if (reference.parent) {
            //is child layer
            message += " Reference layer is child layer of a group.";
        }

        return message;
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
