// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    CleanupHandle,
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
    #loadState: Reactive<LayerLoadState>;

    #stateWatchResource: Resource | undefined;

    #minResolution?: number;
    #maxResolution?: number;
    #visibleInScale: Reactive<boolean>;
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
        this.#minResolution = config.minResolution;
        this.#maxResolution = config.maxResolution;
        this.#visibleInScale = reactive(true);
        this.handle = undefined;

        this[SET_VISIBLE](config.visible ?? true); // apply initial visibility

        if (config.maxResolution) {
            this.#olLayer.setMaxResolution(config.maxResolution);
        }
        if (config.minResolution) {
            this.#olLayer.setMinResolution(config.minResolution);
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
        return this.#minResolution;
    }

    get maxResolution() {
        return this.#maxResolution;
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
        //TODO move the impl. maybe
        this.handle = watchValue(
            () => map.resolution,
            (mapRes) => {
                if (!mapRes) return;

                const minRes = this.minResolution ? this.minResolution : 0;
                const maxRes = this.maxResolution ? this.maxResolution : Infinity;

                this.#visibleInScale.value = mapRes >= minRes && mapRes <= maxRes;
            },
            {
                immediate: true
            }
        );
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
