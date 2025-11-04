// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    computed,
    reactive,
    Reactive,
    ReadonlyReactive,
    synchronized,
    watchValue
} from "@conterra/reactivity-core";
import { createLogger, destroyResource, Resource } from "@open-pioneer/core";
import { EventsKey } from "ol/events";
import OlBaseLayer from "ol/layer/Base";
import OlLayer from "ol/layer/Layer";
import { unByKey } from "ol/Observable";
import OlSource from "ol/source/Source";
import { MapModel } from "../model/MapModel";
import { InternalConstructorTag } from "../utils/InternalConstructorTag";
import { AbstractLayerBase } from "./AbstractLayerBase";
import {
    ATTACH_TO_MAP,
    GET_DEPS,
    getLayerDependencies,
    LAYER_DEPS,
    LayerDependencies,
    SET_VISIBLE
} from "./shared/internals";
import { HealthCheckFunction, LayerConfig } from "./shared/LayerConfig";
import { SimpleLayer, SimpleLayerConfig } from "./SimpleLayer";
import { Layer, LayerTypes } from "./unions";

const LOG = createLogger("map:AbstractLayer");

/**
 * The load state of a layer.
 *
 * @group Layer Utilities
 **/
export type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/**
 * Represents an operational layer in the map.
 *
 * These layers always have an associated OpenLayers layer.
 *
 * Instances of this interface cannot be constructed directly; use a real layer
 * class such as {@link SimpleLayer} instead.
 *
 * @group Layers
 */
export abstract class AbstractLayer extends AbstractLayerBase {
    // Layer dependencies are present when the LayerFactory API was used to construct the layer.
    // They may currently be undefined for compatibility reasons (in which case they will be used
    // from the map, once connected).
    #deps: LayerDependencies | undefined;
    #olLayer: OlBaseLayer;
    #isBaseLayer: boolean;
    #healthCheck?: string | HealthCheckFunction;

    #visible: ReadonlyReactive<boolean>;
    #minResolution: ReadonlyReactive<number>;
    #maxResolution: ReadonlyReactive<number>;
    #minZoom: ReadonlyReactive<number>;
    #maxZoom: ReadonlyReactive<number>;
    #resolution: ReadonlyReactive<number | undefined>;
    #zoom: ReadonlyReactive<number | undefined>;
    #loadState: Reactive<LayerLoadState>;

    #stateWatchResource: Resource | undefined;

    #visibleInScale: ReadonlyReactive<boolean>;

    constructor(
        config: SimpleLayerConfig,
        deps?: LayerDependencies,
        internalTag?: InternalConstructorTag
    ) {
        super(config);
        this.#deps = getLayerDependencies(deps, internalTag);
        this.#olLayer = config.olLayer;
        this.#isBaseLayer = config.isBaseLayer ?? false;
        this.#healthCheck = config.healthCheck;
        this.#visible = synchronized(
            () => this.#olLayer.getVisible(),
            (cb) => {
                const key = this.#olLayer.on("change:visible", cb);
                return () => unByKey(key);
            }
        );
        this.#minResolution = synchronized(
            () => this.#olLayer.getMinResolution(),
            (cb) => {
                const key = this.#olLayer.on("change:minResolution", cb);
                return () => unByKey(key);
            }
        );
        this.#maxResolution = synchronized(
            () => this.#olLayer.getMaxResolution(),
            (cb) => {
                const key = this.#olLayer.on("change:maxResolution", cb);
                return () => unByKey(key);
            }
        );
        this.#minZoom = synchronized(
            () => this.#olLayer.getMinZoom(),
            (cb) => {
                const key = this.#olLayer.on("change:minZoom", cb);
                return () => unByKey(key);
            }
        );
        this.#maxZoom = synchronized(
            () => this.#olLayer.getMaxZoom(),
            (cb) => {
                const key = this.#olLayer.on("change:maxZoom", cb);
                return () => unByKey(key);
            }
        );
        this.#resolution = reactive(undefined);
        this.#zoom = reactive(undefined);

        watchValue(
            () => this.nullableMap,
            (map) => {
                if (!map) return;

                // TODO replace by map.resolution?
                this.#resolution = synchronized(
                    () => map.olView.getResolution(),
                    (cb) => {
                        const key = map.olView.on("change:resolution", cb);
                        return () => unByKey(key);
                    }
                );
                // TODO replace by map.zoom?
                this.#zoom = synchronized(
                    () => map.olView.getZoom(),
                    (cb) => {
                        const key = map.olView.on("change:resolution", cb);
                        return () => unByKey(key);
                    }
                );
            }
        );

        this.#loadState = reactive(getSourceState(getSource(this.#olLayer)));

        this.#visibleInScale = reactive(true);

        this[SET_VISIBLE](config.visible ?? true); // apply initial visibility

        this.#visibleInScale = computed(() => {
            const map = this.nullableMap; // handle case where not in the map yet
            if (!map) {
                return true; // or false? doesn't really matter
            }
            if (this.#resolution.value == undefined) {
                return false;
            }
            if (this.#zoom.value == undefined) {
                return false;
            }

            // TODO check if works correctly
            const parent = this.parent;
            if (parent && parent.type === "group" && !parent.visibleInScale) {
                return false;
            }

            const resolution = this.#resolution.value;
            if (
                resolution < this.#minResolution.value ||
                resolution >= this.#maxResolution.value
            ) {
                return false;
            }

            const zoom = this.#zoom.value;
            return zoom > this.#minZoom.value && zoom <= this.#maxZoom.value;
        });

        if (config.maxResolution) {
            this.#olLayer.setMaxResolution(config.maxResolution);
        }
        if (config.minResolution) {
            this.#olLayer.setMinResolution(config.minResolution);
        }

        if (config.maxZoom) {
            this.#olLayer.setMaxZoom(config.maxZoom);
        }
        if (config.minZoom) {
            this.#olLayer.setMinZoom(config.minZoom);
        }
    }

    override destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.#stateWatchResource = destroyResource(this.#stateWatchResource);
        this.olLayer.dispose();
        super.destroy();
    }

    /**
     * Identifies the type of this layer.
     */
    abstract override readonly type: LayerTypes;

    override get visible(): boolean {
        return this.#visible.value;
    }

    /**
     * The raw OpenLayers layer.
     */
    get olLayer(): OlBaseLayer {
        return this.#olLayer;
    }

    /**
     * True if this layer is a base layer.
     *
     * Only one base layer can be visible at a time.
     */
    get isBaseLayer(): boolean {
        return this.#isBaseLayer;
    }

    /**
     * The load state of a layer.
     */
    get loadState(): LayerLoadState {
        return this.#loadState.value;
    }

    get minResolution() {
        return this.#olLayer.getMinResolution();
    }

    set minResolution(value) {
        this.#olLayer.setMinResolution(value);
    }

    get maxResolution() {
        return this.#olLayer.getMaxResolution();
    }

    set maxResolution(value) {
        this.#olLayer.setMaxResolution(value);
    }

    get minZoom() {
        return this.#olLayer.getMinZoom();
    }

    set minZoom(value) {
        this.#olLayer.setMinZoom(value);
    }

    get maxZoom() {
        return this.#olLayer.getMaxZoom();
    }

    set maxZoom(value) {
        this.#olLayer.setMaxZoom(value);
    }

    /**
     * Whether the layer is visible in the current map scale or not.
     */
    get visibleInScale(): boolean {
        return this.#visibleInScale.value;
    }

    /**
     * Called by the map model when the layer is added to the map.
     *
     * @internal
     */
    override [ATTACH_TO_MAP](map: MapModel): void {
        super[ATTACH_TO_MAP](map);

        if (!this.#stateWatchResource) {
            const { initial: initialState, resource: stateWatchResource } = watchLoadState(
                this,
                this.#healthCheck,
                (state) => {
                    this.#loadState.value = state;
                }
            );
            this.#stateWatchResource = stateWatchResource;
            this.#loadState.value = initialState;
        }
    }

    override setVisible(newVisibility: boolean): void {
        if (this.isBaseLayer) {
            LOG.warn(
                `Cannot change visibility of base layer '${this.id}': use activateBaseLayer() on the map's LayerCollection instead.`
            );
            return;
        }

        this[SET_VISIBLE](newVisibility);
    }

    /** @internal */
    [SET_VISIBLE](newVisibility: boolean): void {
        if (this.#olLayer.getVisible() !== newVisibility) {
            this.#olLayer.setVisible(newVisibility);
        }
    }

    /** @internal */
    [GET_DEPS](): LayerDependencies {
        const deps = this.#deps;
        if (deps) {
            return deps;
        }

        const map = this.nullableMap;
        if (map) {
            return map[LAYER_DEPS];
        }
        throw new Error(
            `Layer '${this.id}' has not been attached to a map yet. "
            + "Use the LayerFactory to create an instance or add the layer to the map first.`
        );
    }
}

function watchLoadState(
    layer: AbstractLayer,
    healthCheck: LayerConfig["healthCheck"],
    onChange: (newState: LayerLoadState) => void
): { initial: LayerLoadState; resource: Resource } {
    const olLayer = layer.olLayer;

    if (!(olLayer instanceof OlLayer)) {
        // Some layers don't have a source (such as group)
        return {
            initial: "loaded",
            resource: {
                destroy() {
                    void 0;
                }
            }
        };
    }

    let currentSource = getSource(olLayer);
    const currentOlLayerState = getSourceState(currentSource);

    let currentLoadState: LayerLoadState = currentOlLayerState;
    let currentHealthState = "loading"; // initial state loading until health check finished

    // custom health check not needed when OpenLayers already returning an error state
    if (currentOlLayerState !== "error") {
        // health check only once during initialization
        doHealthCheck(layer, healthCheck).then((state: LayerLoadState) => {
            currentHealthState = state;
            updateState();
        });
    }

    const updateState = () => {
        const olLayerState = getSourceState(currentSource);
        const nextLoadState: LayerLoadState =
            currentHealthState === "error" ? "error" : olLayerState;

        if (currentLoadState !== nextLoadState) {
            currentLoadState = nextLoadState;
            onChange(currentLoadState);
        }
    };

    let stateHandle: EventsKey | undefined;
    stateHandle = currentSource?.on("change", () => {
        updateState();
    });

    const sourceHandle = olLayer.on("change:source", () => {
        // unsubscribe from old source
        stateHandle && unByKey(stateHandle);
        stateHandle = undefined;

        // subscribe to new source and update state
        currentSource = getSource(olLayer);
        stateHandle = currentSource?.on("change", () => {
            updateState();
        });
        updateState();
    });
    return {
        initial: currentLoadState,
        resource: {
            destroy() {
                stateHandle && unByKey(stateHandle);
                unByKey(sourceHandle);
            }
        }
    };
}

async function doHealthCheck(
    layer: AbstractLayer,
    healthCheck: LayerConfig["healthCheck"]
): Promise<LayerLoadState> {
    if (healthCheck == null) {
        return "loaded";
    }

    let healthCheckFn: HealthCheckFunction;
    if (typeof healthCheck === "function") {
        healthCheckFn = healthCheck;
    } else if (typeof healthCheck === "string") {
        healthCheckFn = async () => {
            const httpService = layer[GET_DEPS]().httpService;
            const response = await httpService.fetch(healthCheck);
            if (response.ok) {
                return "loaded";
            }
            LOG.warn(
                `Health check failed for layer '${layer.id}' (http status ${response.status})`
            );
            return "error";
        };
    } else {
        LOG.error(
            `Unexpected object for 'healthCheck' parameter of layer '${layer.id}'`,
            healthCheck
        );
        return "error";
    }

    try {
        return await healthCheckFn(layer as Layer);
    } catch (e) {
        LOG.warn(`Health check failed for layer '${layer.id}'`, e);
        return "error";
    }
}

function getSource(olLayer: OlLayer | OlBaseLayer) {
    if (!(olLayer instanceof OlLayer)) {
        return undefined;
    }
    return (olLayer?.getSource() as OlSource | null) ?? undefined;
}

function getSourceState(olSource: OlSource | undefined) {
    const state = olSource?.getState();
    switch (state) {
        case undefined:
            return "loaded";
        case "undefined":
            return "not-loaded";
        case "loading":
            return "loading";
        case "ready":
            return "loaded";
        case "error":
            return "error";
    }
}
