// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CleanupHandle,
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
import BaseLayer from "ol/layer/Base";

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
    #loadState: Reactive<LayerLoadState>;

    #stateWatchResource: Resource | undefined;

    #minResolution?: ReadonlyReactive<number>;
    #maxResolution?: ReadonlyReactive<number>;
    #minZoom?: ReadonlyReactive<number>;
    #maxZoom?: ReadonlyReactive<number>;
    #visibleInScale: ReadonlyReactive<boolean>;
    #layerBindings: ReadonlyReactive<LayerBindings>;
    private handle: CleanupHandle | undefined;

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
        this.#loadState = reactive(getSourceState(getSource(this.#olLayer)));
        this.#layerBindings = computed(() => createLayerBinding(this.#olLayer));

        this.#minResolution = this.#layerBindings.value.minResolution;
        this.#maxResolution = this.#layerBindings.value.maxResolution;
        this.#minZoom = this.#layerBindings.value.minZoom;
        this.#maxZoom = this.#layerBindings.value.maxZoom;

        this.#visibleInScale = reactive(true);
        this.handle = undefined;

        this[SET_VISIBLE](config.visible ?? true); // apply initial visibility

        watchValue(
            () => this.nullableMap,
            (map) => {
                if (!map) {
                    return;
                }
                this.#visibleInScale = computed(() => {
                    if (config.maxResolution != undefined || config.minResolution != undefined) {
                        const minRes = this.#minResolution?.value ? this.#minResolution.value : 0;
                        const maxRes = this.#maxResolution?.value
                            ? this.#maxResolution.value
                            : Infinity;
                        const mapRes = map.resolution;
                        if (!mapRes) {
                            return false;
                        }
                        return mapRes >= minRes && mapRes <= maxRes;
                    } else {
                        const minZoom = this.#minZoom?.value ? this.#minZoom.value : 0;
                        const maxZoom = this.#maxZoom?.value ? this.#maxZoom.value : Infinity;
                        const mapZoom = map.zoomLevel;
                        if (!mapZoom) {
                            return false;
                        }
                        return mapZoom >= minZoom && mapZoom <= maxZoom;
                    }
                });
            }
        );

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
        this.handle?.destroy();
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
        return this.#minResolution?.value;
    }

    get maxResolution() {
        return this.#maxResolution?.value;
    }

    get minZoom() {
        return this.#minZoom?.value;
    }

    get maxZoom() {
        return this.#maxZoom?.value;
    }

    get visibleInScale() {
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
interface LayerBindings {
    minResolution: ReadonlyReactive<number>;
    maxResolution: ReadonlyReactive<number>;
    minZoom: ReadonlyReactive<number>;
    maxZoom: ReadonlyReactive<number>;
}
function createLayerBinding(olLayer: OlLayer | BaseLayer) {
    return {
        minResolution: synchronized(
            () => olLayer.getMinResolution(),
            (cb) => {
                const key = olLayer.on("change:minResolution", cb);
                return () => unByKey(key);
            }
        ),
        maxResolution: synchronized(
            () => olLayer.getMaxResolution(),
            (cb) => {
                const key = olLayer.on("change:maxResolution", cb);
                return () => unByKey(key);
            }
        ),
        minZoom: synchronized(
            () => olLayer.getMinZoom(),
            (cb) => {
                const key = olLayer.on("change:minZoom", cb);
                return () => unByKey(key);
            }
        ),
        maxZoom: synchronized(
            () => olLayer.getMaxZoom(),
            (cb) => {
                const key = olLayer.on("change:maxZoom", cb);
                return () => unByKey(key);
            }
        )
    };
}
