// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource, createLogger } from "@open-pioneer/core";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import OlBaseLayer from "ol/layer/Base";
import OlLayer from "ol/layer/Layer";
import OlSource from "ol/source/Source";
import { HealthCheckFunction, Layer, LayerConfig, LayerLoadState, SimpleLayerConfig } from "../api";
import { AbstractLayerBase } from "./AbstractLayerBase";
import { MapModelImpl } from "./MapModelImpl";

const LOG = createLogger("map:AbstractLayer");

/**
 * Base class for normal layer types.
 *
 * These layers always have an associated OpenLayers layer.
 */
export abstract class AbstractLayer<AdditionalEvents = {}>
    extends AbstractLayerBase<AdditionalEvents>
    implements Layer
{
    #olLayer: OlBaseLayer;
    #isBaseLayer: boolean;
    #healthCheck?: string | HealthCheckFunction;
    #visible: boolean;

    #loadState: LayerLoadState;
    #stateWatchResource: Resource | undefined;

    constructor(config: SimpleLayerConfig) {
        super(config);
        this.#olLayer = config.olLayer;
        this.#isBaseLayer = config.isBaseLayer ?? false;
        this.#healthCheck = config.healthCheck;

        this.#visible = config.visible ?? true;
        this.#loadState = getSourceState(getSource(this.#olLayer));

        this.__setVisible(this.#visible); // apply initial visibility
    }

    get visible(): boolean {
        return this.#visible;
    }

    get olLayer(): OlBaseLayer {
        return this.#olLayer;
    }

    get isBaseLayer(): boolean {
        return this.#isBaseLayer;
    }

    get loadState(): LayerLoadState {
        return this.#loadState;
    }

    destroy() {
        if (this.__destroyed) {
            return;
        }

        this.#stateWatchResource?.destroy();
        this.olLayer.dispose();
        super.destroy();
    }

    /**
     * Called by the map model when the layer is added to the map.
     */
    __attach(map: MapModelImpl): void {
        super.__attachToMap(map);

        const { initial: initialState, resource: stateWatchResource } = watchLoadState(
            this,
            this.#healthCheck,
            (state) => {
                this.#setLoadState(state);
            }
        );
        this.#stateWatchResource = stateWatchResource;
        this.#setLoadState(initialState);
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
        let changed = false;
        if (this.#visible !== newVisibility) {
            this.#visible = newVisibility;
            changed = true;
        }

        // Improvement: actual map sync?
        if (this.#olLayer.getVisible() != this.#visible) {
            this.#olLayer.setVisible(newVisibility);
        }
        changed && this.__emitChangeEvent("changed:visible");
    }

    #setLoadState(loadState: LayerLoadState) {
        if (loadState !== this.#loadState) {
            this.#loadState = loadState;
            this.__emitChangeEvent("changed:loadState");
        }
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
            const httpService = layer.map.__sharedDependencies.httpService;
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
        return await healthCheckFn(layer);
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
