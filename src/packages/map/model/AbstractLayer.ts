// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource, createLogger } from "@open-pioneer/core";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import OlBaseLayer from "ol/layer/Base";
import OlLayer from "ol/layer/Layer";
import Source, { State as OlSourceState } from "ol/source/Source";
import { HealthCheckFunction, Layer, LayerLoadState, SimpleLayerConfig } from "../api";
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

        const { initial: initialState, resource: stateWatchResource } = watchLoadState(
            config,
            (state) => {
                this.#loadState = state;
                // hide layer when it becomes unavailable
                // avoid that the layer is displayed again, but shown as unavailable when the map
                // service is available again after initial health check
                if (state === "error") {
                    this.setVisible(false);
                }
                this.__emitChangeEvent("changed:loadState");
            }
        );
        this.#loadState = initialState;
        this.#stateWatchResource = stateWatchResource;
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
}

// TODO move to a service?
function healthCheck(config: SimpleLayerConfig): Promise<LayerLoadState> {
    return new Promise((resolve, reject) => {
        if (!("healthCheck" in config)) {
            resolve("loaded");
        }

        if (typeof config.healthCheck === "function") {
            config.healthCheck(config).then((result) => resolve(result));
        } else if (typeof config.healthCheck === "string") {
            // TODO replace by fetch from HttpService
            fetch(config.healthCheck)
                .then((response) => {
                    response.ok ? resolve("loaded") : resolve("error");
                })
                .catch(() => resolve("error"));
        } else {
            reject();
        }
    });
}

function watchLoadState(
    config: SimpleLayerConfig,
    onChange: (newState: LayerLoadState) => void
): { initial: LayerLoadState; resource: Resource } {
    const olLayer = config.olLayer;

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

    let currentSource = olLayer?.getSource() as Source | null;
    const currentOlLayerState = mapState(currentSource?.getState());

    let currentHealthState = "loading"; // initial state loading until health check finished
    let currentLoadState: LayerLoadState =
        currentHealthState === "error" ? "error" : currentOlLayerState;

    // custom health check not needed when OL already returning an error state
    if (currentOlLayerState !== "error") {
        // health check only once during initialization
        healthCheck(config).then((state: LayerLoadState) => {
            currentHealthState = state;
            updateState();
        });
    }

    const updateState = () => {
        const olLayerState = mapState(currentSource?.getState());
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
        currentSource = olLayer?.getSource() as Source | null;
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

function mapState(state: OlSourceState | undefined): LayerLoadState {
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
