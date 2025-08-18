// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, Reactive, ReadonlyReactive, synchronized } from "@conterra/reactivity-core";
import { createLogger, destroyResource, Resource } from "@open-pioneer/core";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import OlBaseLayer from "ol/layer/Base";
import OlLayer from "ol/layer/Layer";
import OlSource from "ol/source/Source";
import {
    HealthCheckFunction,
    Layer,
    LayerBaseType,
    LayerConfig,
    LayerLoadState,
    SimpleLayerConfig
} from "../api";
import { AbstractLayerBase } from "./AbstractLayerBase";
import { MapModelImpl } from "./MapModelImpl";
import {
    getLayerDependencies,
    InternalConstructorTag,
    LayerDependencies
} from "./layers/internals";

const LOG = createLogger("map:AbstractLayer");

/**
 * Base class for normal layer types.
 *
 * These layers always have an associated OpenLayers layer.
 */
export abstract class AbstractLayer<AdditionalEvents = {}>
    extends AbstractLayerBase<AdditionalEvents>
    implements LayerBaseType
{
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

        this.__setVisible(config.visible ?? true); // apply initial visibility
    }

    abstract readonly type: "simple" | "wms" | "wmts" | "group";

    get visible(): boolean {
        return this.#visible.value;
    }

    get olLayer(): OlBaseLayer {
        return this.#olLayer;
    }

    get isBaseLayer(): boolean {
        return this.#isBaseLayer;
    }

    get loadState(): LayerLoadState {
        return this.#loadState.value;
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.#stateWatchResource = destroyResource(this.#stateWatchResource);
        this.olLayer.dispose();
        super.destroy();
    }

    /**
     * Called by the map model when the layer is added to the map.
     */
    __attachToMap(map: MapModelImpl): void {
        super.__attachToMap(map);

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

    setVisible(newVisibility: boolean): void {
        if (this.isBaseLayer) {
            LOG.warn(
                `Cannot change visibility of base layer '${this.id}': use activateBaseLayer() on the map's LayerCollection instead.`
            );
            return;
        }

        this.__setVisible(newVisibility);
    }

    __setVisible(newVisibility: boolean): void {
        if (this.#olLayer.getVisible() !== newVisibility) {
            this.#olLayer.setVisible(newVisibility);
        }
    }

    __getDeps(): LayerDependencies {
        const deps = this.#deps;
        if (deps) {
            return deps;
        }

        const map = this.nullableMap;
        if (map) {
            return map.__layerDeps;
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
            const httpService = layer.__getDeps().httpService;
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
