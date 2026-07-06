// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    computed,
    reactive,
    Reactive,
    ReadonlyReactive,
    synchronized
} from "@conterra/reactivity-core";
import { createLogger, deepEqual } from "@open-pioneer/core";
import OlBaseLayer from "ol/layer/Base";
import OlLayer from "ol/layer/Layer";
import { unByKey } from "ol/Observable";
import OlSource from "ol/source/Source";
import { sourceId } from "open-pioneer:source-info";
import { MapModel } from "../model/MapModel";
import { InternalConstructorTag } from "../utils/InternalConstructorTag";
import { AbstractLayerBase } from "./AbstractLayerBase";
import {
    ATTACH_TO_MAP,
    GET_DEPS,
    getLayerDependencies,
    LAYER_DEPS,
    LayerDependencies,
    SET_METADATA_STATE,
    SET_VISIBLE
} from "./shared/internals";
import { HealthCheckFunction, LayerConfig } from "./shared/LayerConfig";
import { SimpleLayer, SimpleLayerConfig } from "./SimpleLayer";
import { AnyLayer, Layer, LayerTypes } from "./unions";

const LOG = createLogger(sourceId);

/**
 * The load state of a layer.
 *
 * @group Layer Utilities
 **/
export type LayerLoadState = "not-loaded" | "loading" | "loaded" | "error";

/**
 * Load state of a single layer, bundling the state with its error.
 */
type LayerLoadInfo = "not-loaded" | "loading" | "loaded" | { kind: "error"; error: Error };

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

    #sourceState: ReadonlyReactive<LayerLoadState>;
    #sourceInfo: ReadonlyReactive<LayerLoadInfo>;
    #healthInfo: Reactive<LayerLoadInfo>;
    #metadataInfo: Reactive<LayerLoadInfo>;
    #loadInfo = computed(() =>
        combineLoadInfos(this.#sourceInfo.value, this.#healthInfo.value, this.#metadataInfo.value)
    );
    #sublayerError = computed(() => collectSublayerError(this), {
        equal: deepEqual
    });
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

        this.#sourceState = synchronized(
            () => getSourceState(getSource(this.#olLayer)),
            (cb) => subscribeToSourceState(this.#olLayer, cb)
        );
        // OpenLayers sources carry no error detail, so synthesize one.
        this.#sourceInfo = computed(() => makeSourceInfo(this.id, this.#sourceState.value));
        this.#healthInfo = reactive<LayerLoadInfo>("not-loaded");
        this.#metadataInfo = reactive<LayerLoadInfo>("not-loaded");

        this[SET_VISIBLE](config.visible ?? true); // apply initial visibility

        this.#visibleInScale = computed(() => {
            const map = this.nullableMap; // handle case where not in the map yet
            if (!map) {
                return true; // or false? doesn't really matter
            }

            const zoom = map.zoomLevel;
            const resolution = map.resolution;
            if (zoom == null || resolution == null) {
                return false;
            }

            const parent = this.parent;
            if (parent && parent.type === "group" && !parent.visibleInScale) {
                return false;
            }

            if (resolution < this.minResolution || resolution >= this.maxResolution) {
                return false;
            }

            return zoom > this.minZoom && zoom <= this.maxZoom;
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
     * The combined load state of a layer.
     *
     * Aggregates the OpenLayers source state, health check and metadata state.
     * Priority for the state: `error` > `loading` > `not-loaded` > `loaded`.
     */
    get loadState(): LayerLoadState {
        return loadInfoState(this.#loadInfo.value);
    }

    /**
     * The most relevant error associated with this layer, if any.
     *
     * Combines errors from the OpenLayers source, the health check and the
     * metadata request (health > metadata > source).
     */
    get error(): Error | undefined {
        return errorOf(this.#loadInfo.value);
    }

    /**
     * The combined errors of all sublayers
     */
    get sublayerError(): AggregateError | undefined {
        return this.#sublayerError.value;
    }

    /**
     * The minimum resolution (inclusive) at which this layer will be visible.
     */
    get minResolution() {
        return this.#minResolution.value;
    }

    /**
     * The maximum resolution (exclusive) below which this layer will be visible.
     */
    get maxResolution() {
        return this.#maxResolution.value;
    }

    /**
     * The minimum view zoom level (exclusive) above which this layer will be visible.
     */
    get minZoom() {
        return this.#minZoom.value;
    }

    /**
     * The maximum view zoom level (inclusive) at which this layer will be visible.
     */
    get maxZoom() {
        return this.#maxZoom.value;
    }

    /**
     * Whether the layer is visible in the current map scale or not.
     */
    get visibleInScale(): boolean {
        return this.#visibleInScale.value;
    }

    /**
     * The minimum resolution (inclusive) at which this layer will be visible.
     */
    setMinResolution(value: number): void {
        this.#olLayer.setMinResolution(value);
    }

    /**
     * The maximum resolution (exclusive) below which this layer will be visible.
     */
    setMaxResolution(value: number): void {
        this.#olLayer.setMaxResolution(value);
    }

    /**
     * The minimum view zoom level (exclusive) above which this layer will be visible.
     */
    setMinZoom(value: number): void {
        this.#olLayer.setMinZoom(value);
    }

    /**
     * The maximum view zoom level (inclusive) at which this layer will be visible.
     */
    setMaxZoom(value: number): void {
        this.#olLayer.setMaxZoom(value);
    }

    /**
     * Called by the map model when the layer is added to the map.
     *
     * @internal
     */
    override [ATTACH_TO_MAP](map: MapModel): void {
        super[ATTACH_TO_MAP](map);

        // Custom health check is not needed when OpenLayers already reports an error state.
        if (this.#sourceState.value !== "error") {
            doHealthCheck(this, this.#healthCheck).then(({ state, error }) => {
                this.#healthInfo.value = toLoadInfo(state, error);
            });
        }
    }

    /**
     * Updates the load state of the layer's metadata request.
     *
     * @internal
     */
    [SET_METADATA_STATE](state: LayerLoadState, error?: Error): void {
        this.#metadataInfo.value = toLoadInfo(state, error);
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

function subscribeToSourceState(olLayer: OlBaseLayer, cb: () => void): () => void {
    if (!(olLayer instanceof OlLayer)) {
        // Some layers don't have a source (such as group).
        return () => undefined;
    }

    let sourceHandle = getSource(olLayer)?.on("change", cb);
    const layerHandle = olLayer.on("change:source", () => {
        sourceHandle && unByKey(sourceHandle);
        sourceHandle = getSource(olLayer)?.on("change", cb);
        cb();
    });

    return () => {
        sourceHandle && unByKey(sourceHandle);
        unByKey(layerHandle);
    };
}

async function doHealthCheck(
    layer: AbstractLayer,
    healthCheck: LayerConfig["healthCheck"]
): Promise<{ state: LayerLoadState; error: Error | undefined }> {
    if (healthCheck == null) {
        return { state: "loaded", error: undefined };
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
        return {
            state: "error",
            error: new Error(`Invalid 'healthCheck' configuration for layer '${layer.id}'`)
        };
    }

    try {
        const state = await healthCheckFn(layer as Layer);
        if (state === "error") {
            return {
                state,
                error: new Error(`Health check failed for layer '${layer.id}'`)
            };
        }
        return { state, error: undefined };
    } catch (e) {
        LOG.warn(`Health check failed for layer '${layer.id}'`, e);
        return {
            state: "error",
            error: e instanceof Error ? e : new Error(String(e))
        };
    }
}

const LOAD_STATE_SEVERITY: Record<LayerLoadState, number> = {
    loaded: 0,
    "not-loaded": 1,
    loading: 2,
    error: 3
};

/** Returns the higher severity of two load states: error > loading > not-loaded > loaded. */
function higherSeverity(a: LayerLoadState, b: LayerLoadState): LayerLoadState {
    return LOAD_STATE_SEVERITY[a] >= LOAD_STATE_SEVERITY[b] ? a : b;
}

function combineLoadInfos(
    source: LayerLoadInfo,
    health: LayerLoadInfo,
    metadata: LayerLoadInfo
): LayerLoadInfo {
    // If several channels are in error, report the most relevant one (health > metadata > source).
    const error = errorOf(health) ?? errorOf(metadata) ?? errorOf(source);
    if (error) {
        return { kind: "error", error };
    }
    return higherSeverity(loadInfoState(source), loadInfoState(metadata)) as LayerLoadInfo;
}

function errorOf(info: LayerLoadInfo): Error | undefined {
    return typeof info === "object" ? info.error : undefined;
}

function loadInfoState(info: LayerLoadInfo): LayerLoadState {
    return typeof info === "object" ? "error" : info;
}

function toLoadInfo(state: LayerLoadState, error: Error | undefined): LayerLoadInfo {
    if (state === "error") {
        return { kind: "error", error: error ?? new Error("Unknown error") };
    }
    return state;
}

function collectSublayerError(layer: AbstractLayer): AggregateError | undefined {
    const errors: Error[] = [];
    for (const descendant of walkDescendants(layer)) {
        const error = descendant.error;
        if (error) {
            errors.push(error);
        }
    }
    if (errors.length === 0) {
        return undefined;
    }
    return new AggregateError(
        errors,
        `Layer '${layer.id}' has ${errors.length} sublayer(s) in error state`
    );
}

function* walkDescendants(layer: AbstractLayerBase): Generator<AnyLayer> {
    const children = layer.children?.getItems({ includeInternalLayers: true });
    if (!children) {
        return;
    }
    for (const child of children) {
        yield child;
        yield* walkDescendants(child);
    }
}

function makeSourceInfo(id: string, state: LayerLoadState): LayerLoadInfo {
    if (state === "error") {
        return {
            kind: "error",
            error: new Error(`Source of layer '${id}' is in error state`)
        };
    }
    return state;
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
