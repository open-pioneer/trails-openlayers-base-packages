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
import { AbstractLayer } from "../layers/AbstractLayer";
import { AbstractLayerBase } from "../layers/AbstractLayerBase";
import {
    ATTACH_TO_MAP,
    DETACH_FROM_MAP,
    GET_RAW_LAYERS,
    GET_RAW_SUBLAYERS,
    SET_VISIBLE
} from "../layers/shared/internals";
import { assertInternalConstructor, InternalConstructorTag } from "../utils/InternalConstructorTag";
import { AnyLayer, Layer, Sublayer } from "../layers/unions";
import type { AddLayerOptions } from "../layers/shared/AddLayerOptions";
import type {
    LayerRetrievalOptions,
    RecursiveRetrievalOptions
} from "../layers/shared/LayerRetrievalOptions";
import { MapModel } from "./MapModel";
import { getRecursiveLayers } from "../layers/shared/getRecursiveLayers";

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
 * Contains the layers contained in a {@link MapModel}.
 */
export class LayerCollection {
    #map: MapModel;

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

    /** @internal */
    constructor(map: MapModel, tag: InternalConstructorTag) {
        assertInternalConstructor(tag);

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

    /**
     * Adds a new layer to the map.
     *
     * The new layer is automatically registered with this collection.
     *
     * ### Display order
     *
     * By default, the new layer will be shown on _top_ of all normal operational layers.
     * Use the `options` parameter to control the insertion point.
     *
     * ### Ownership
     *
     * The map model takes ownership of the new layer.
     * This means that the layer will be destroyed if the map model is destroyed.
     */
    addLayer(layer: Layer, options?: AddLayerOptions): void {
        batch(() => {
            checkLayerInstance(layer);

            layer[ATTACH_TO_MAP](this.#map);
            this.#addLayer(layer, options);
        });
    }

    /**
     * Returns all configured base layers.
     */
    getBaseLayers(): Layer[] {
        // Slightly inefficient, but we don't need a separate index for base layers right now.
        return Array.from(this.#topLevelLayers).filter((layer) => layer.isBaseLayer);
    }

    /**
     * Returns the currently active base layer.
     */
    getActiveBaseLayer(): Layer | undefined {
        return this.#activeBaseLayer.value;
    }

    /**
     * Activates the base layer with the given id.
     * `undefined` can be used to hide all base layers.
     *
     * The associated layer is made visible and all other base layers are hidden.
     *
     * Returns true if the given layer has been successfully activated.
     */
    activateBaseLayer(id: string | undefined): boolean {
        let newBaseLayer = undefined;
        if (id != null) {
            newBaseLayer = this.#layersById.get(id);
            if (!newBaseLayer) {
                LOG.warn(`Cannot activate base layer '${id}': layer is unknown.`);
                return false;
            }
            if (!(newBaseLayer instanceof AbstractLayer)) {
                LOG.warn(`Cannot activate base layer '${id}: layer has an invalid type.'`);
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

    /**
     * Returns a list of operational layers, starting from the root of the map's layer hierarchy.
     * The returned list includes top level layers only. Use {@link getRecursiveLayers()} to retrieve (nested) child layers.
     */
    getOperationalLayers(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options).filter((layer) => !layer.isBaseLayer);
    }

    /**
     * Returns a list of layers known to this collection. This includes base layers and operational layers.
     * The returned list includes top level layers only. Use {@link getRecursiveLayers()} to retrieve (nested) child layers.
     */
    getLayers(options?: LayerRetrievalOptions): Layer[] {
        let allLayers: Layer[];

        if (options?.sortByDisplayOrder) {
            const baseLayers = this.getBaseLayers();
            const order = Array.from(this.#operationalLayerOrder);
            const topMost = Array.from(this.#topMostOperationalLayers);
            allLayers = [...baseLayers, ...order, ...topMost];
        } else {
            allLayers = Array.from(this.#topLevelLayers.values());
        }

        if (!options?.includeInternalLayers) {
            allLayers = allLayers.filter((l) => !l.internal);
        }
        return allLayers;
    }

    /**
     * Returns a list of layers known to this collection. This includes base layers and operational layers.
     * The returned list includes top level layers only. Use {@link getRecursiveLayers()} to retrieve (nested) child layers.
     *
     * @deprecated Use {@link getLayers()}, {@link getOperationalLayers()} or {@link getRecursiveLayers()} instead.
     * This method name is misleading since it does not recurse into child layers.
     */
    getAllLayers(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options);
    }

    /**
     * Returns a list of all layers in this collection, including all children (recursively).
     *
     * > Note: This includes base layers by default (see `options.filter`).
     * > Use the `"base"` or `"operational"` short hand values to filter by base layer or operational layers.
     * >
     * > If the layer hierarchy is deeply nested, this function could potentially be expensive.
     */
    getRecursiveLayers({
        filter,
        sortByDisplayOrder,
        includeInternalLayers
    }: Omit<RecursiveRetrievalOptions, "filter"> & {
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
            sortByDisplayOrder,
            includeInternalLayers
        });
    }

    getItems(options?: LayerRetrievalOptions): Layer[] {
        return this.getLayers(options);
    }

    /**
     * Returns the layer identified by the `id` or undefined, if no such layer exists.
     */
    getLayerById(id: string): AnyLayer | undefined {
        return this.#layersById.get(id);
    }

    /**
     * Removes a layer identified by the `id` from the map.
     *
     * NOTE: The current implementation only supports removal of _top level_ layers.
     *
     * ### Ownership
     *
     * This function _destroys_ the layer instance and all its children.
     *
     * @deprecated Use {@link removeLayer} instead.
     */
    removeLayerById(id: string): void {
        batch(() => {
            const layer = this.#layersById.get(id);
            if (!layer) {
                LOG.isDebug() && LOG.debug(`Cannot remove layer '${id}': layer is unknown.`);
                return;
            }

            checkLayerInstance(layer);
            if (!this.#topLevelLayers.has(layer)) {
                LOG.warn(
                    `Cannot remove layer '${layer.id}': only top level layers can be removed at this time.`
                );
                return;
            }

            this.#removeLayer(layer);
            layer.destroy();
        });
    }

    /**
     * Removes the given top level layer from the map.
     *
     * The layer can be specified directly (as an object) or by an id.
     *
     * Returns the layer instance on success, or `undefined` if the layer was not found.
     *
     * ### Ownership
     *
     * The map releases ownership of this layer.
     * The caller can destroy it or store it for later reuse.
     */
    removeLayer(layer: string | Layer): Layer | undefined {
        return batch(() => {
            let actualLayer;
            if (typeof layer === "string") {
                actualLayer = this.#layersById.get(layer);
                if (!actualLayer) {
                    return undefined;
                }
            } else {
                actualLayer = layer;
            }

            checkLayerInstance(actualLayer);
            if (!this.#topLevelLayers.has(actualLayer)) {
                return undefined;
            }

            this.#removeLayer(actualLayer);
            actualLayer[DETACH_FROM_MAP]();
            return actualLayer;
        });
    }

    /**
     * Given a raw OpenLayers layer instance, returns the associated {@link Layer} - or undefined
     * if the layer is unknown to this collection.
     */
    getLayerByRawInstance(layer: OlBaseLayer): Layer | undefined {
        return this.#layersByOlLayer?.get(layer);
    }

    /**
     * Adds the given layer to the map and all relevant indices.
     */
    #addLayer(layer: LayerType, options: AddLayerOptions | undefined) {
        // Throws; do this before manipulating the data structures
        const pos = this.#getInsertionPos(layer, options);
        this.#indexLayer(layer);

        // Everything below this line should not fail.
        if (pos.which === "base") {
            if (!this.#activeBaseLayer.value && layer.visible) {
                this.#updateBaseLayer(layer);
            } else {
                layer[SET_VISIBLE](false);
            }
        } else {
            layer[SET_VISIBLE](layer.visible);

            const layerList = this.#getLayerList(pos);
            layerList.splice(pos.index, 0, layer); // insert new layer at insertion index
        }
        this.#topLevelLayers.add(layer);
        this.#map.olMap.addLayer(layer.olLayer);
    }

    #getInsertionPos(layer: LayerType, options: AddLayerOptions | undefined): LayerPos {
        if (layer.isBaseLayer) {
            if (options?.at) {
                throw new Error(
                    `Cannot add base layer '${layer.id}' at a specific position: only operational layers can be added at a specific position.`
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
                    const errorMessage = this.#getInsertErrorMessage(layer, reference);
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
    #removeLayer(layer: LayerType) {
        this.#map.olMap.removeLayer(layer.olLayer);
        this.#topLevelLayers.delete(layer);
        if (!layer.isBaseLayer) {
            const pos = this.#findOpOrTopmost(layer)!;
            const layerList = this.#getLayerList(pos);
            layerList.splice(pos.index, 1);
        }

        this.#unIndexLayer(layer);
        if (this.#activeBaseLayer.value === layer) {
            const newBaseLayer = this.getBaseLayers()[0];
            if (newBaseLayer) {
                checkLayerInstance(newBaseLayer);
            }
            this.#updateBaseLayer(newBaseLayer);
        }
    }

    #updateBaseLayer(layer: LayerType | undefined) {
        if (this.#activeBaseLayer.value === layer) {
            return;
        }

        if (LOG.isDebug()) {
            const getId = (layer: AbstractLayer | undefined) => {
                return layer ? `'${layer.id}'` : undefined;
            };

            LOG.debug(
                `Switching active base layer from ${getId(this.#activeBaseLayer.value)} to ${getId(layer)}`
            );
        }

        batch(() => {
            this.#activeBaseLayer.value?.[SET_VISIBLE](false);
            this.#activeBaseLayer.value = layer;
            layer?.[SET_VISIBLE](true);
        });
    }

    /**
     * Index the layer and all its children.
     */
    #indexLayer(layer: LayerType) {
        // layer id -> layer (or sublayer)
        const registrations: [string, OlBaseLayer | undefined][] = [];
        const visit = (layer: LayerType | (AbstractLayerBase & Sublayer)) => {
            const id = layer.id;
            const olLayer = "olLayer" in layer ? layer.olLayer : undefined;
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
            this.#layersById.set(id, layer);
            if (olLayer) {
                this.#layersByOlLayer.set(olLayer, layer as LayerType); // ol is present --> not a sublayer
            }
            registrations.push([id, olLayer]);

            // Recurse into nested children.
            for (const childLayer of layer.layers?.[GET_RAW_LAYERS]() ?? []) {
                visit(childLayer);
            }
            for (const sublayer of layer.sublayers?.[GET_RAW_SUBLAYERS]() ?? []) {
                visit(sublayer);
            }
        };

        try {
            visit(layer);
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
    #unIndexLayer(layer: AbstractLayer) {
        const visit = (layer: AbstractLayer | AbstractLayerBase) => {
            if ("olLayer" in layer) {
                this.#layersByOlLayer.delete(layer.olLayer);
            }
            this.#layersById.delete(layer.id);

            for (const childLayer of layer.layers?.[GET_RAW_LAYERS]() ?? []) {
                visit(childLayer);
            }

            for (const sublayer of layer.sublayers?.[GET_RAW_SUBLAYERS]() ?? []) {
                visit(sublayer);
            }
        };
        visit(layer);
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
