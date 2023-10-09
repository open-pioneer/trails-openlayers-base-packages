// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, EventNames, Resource, createLogger } from "@open-pioneer/core";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import OlBaseLayer from "ol/layer/Base";
import OlLayer from "ol/layer/Layer";
import Source, { State as OlSourceState } from "ol/source/Source";
import {
    LayerConfig,
    LayerLoadState,
    LayerModel,
    LayerModelBaseEvents,
    MapModel,
    SublayersCollection
} from "../api";
import { MapModelImpl } from "./MapModelImpl";

const LOG = createLogger("map:LayerModel");

export class LayerModelImpl extends EventEmitter<LayerModelBaseEvents> implements LayerModel {
    #id: string;
    #map: MapModelImpl;
    #olLayer: OlBaseLayer;
    #isBaseLayer: boolean;
    #attributes: Record<string | symbol, unknown>;
    #visible: boolean;
    #destroyed = false;

    #title: string;
    #description: string;

    #loadState: LayerLoadState;
    #stateWatchResource: Resource | undefined;

    constructor(map: MapModelImpl, config: Required<LayerConfig>) {
        super();
        this.#id = config.id;
        this.#map = map;
        this.#olLayer = config.layer;
        this.#isBaseLayer = config.isBaseLayer;
        this.#attributes = config.attributes;
        this.#visible = config.visible;
        this.#title = config.title;
        this.#description = config.description;

        const { initial: initialState, resource: stateWatchResource } = watchLoadState(
            this.#olLayer,
            (state) => {
                this.#loadState = state;
                this.#emitChangeEvent("changed:loadState");
            }
        );
        this.#loadState = initialState;
        this.#stateWatchResource = stateWatchResource;
    }

    get map(): MapModel {
        return this.#map;
    }

    get id(): string {
        return this.#id;
    }

    get title(): string {
        return this.#title;
    }

    get description(): string {
        return this.#description;
    }

    get loadState(): LayerLoadState {
        return this.#loadState;
    }

    get attributes(): Record<string | symbol, unknown> {
        return this.#attributes;
    }

    get visible(): boolean {
        return this.#visible;
    }

    get sublayers(): SublayersCollection | undefined {
        // TODO: Not implemented yet
        return undefined;
    }

    get olLayer(): OlBaseLayer {
        return this.#olLayer;
    }

    get isBaseLayer(): boolean {
        return this.#isBaseLayer;
    }

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        try {
            this.emit("destroy");
        } catch (e) {
            LOG.warn(`Unexpected error from event listener during layer model destruction:`, e);
        }

        this.#stateWatchResource?.destroy();
        this.olLayer.dispose();
    }

    setTitle(newTitle: string): void {
        if (newTitle !== this.#title) {
            this.#title = newTitle;
            this.#emitChangeEvent("changed:title");
        }
    }

    setDescription(newDescription: string): void {
        if (newDescription !== this.#description) {
            this.#description = newDescription;
            this.#emitChangeEvent("changed:description");
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
        let changed = false;
        if (this.#visible !== newVisibility) {
            this.#visible = newVisibility;
            changed = true;
        }

        // Improvement: actual map sync?
        if (this.#olLayer.getVisible() != this.#visible) {
            this.#olLayer.setVisible(newVisibility);
        }
        changed && this.#emitChangeEvent("changed:visible");
    }

    updateAttributes(newAttributes: Record<string | symbol, unknown>): void {
        const attributes = this.#attributes;
        const keys = Reflect.ownKeys(newAttributes);

        let changed = false;
        for (const key of keys) {
            const existing = attributes[key];
            const value = newAttributes[key];
            if (existing !== value) {
                attributes[key] = value;
                changed = true;
            }
        }

        if (changed) {
            this.#emitChangeEvent("changed:attributes");
        }
    }

    deleteAttribute(deleteAttribute: string | symbol): void {
        const attributes = this.#attributes;
        const key = deleteAttribute;

        let changed = false;
        if (attributes[key]) {
            delete attributes[key];
            changed = true;
        }

        if (changed) {
            this.#emitChangeEvent("changed:attributes");
        }
    }

    #emitChangeEvent<Name extends EventNames<LayerModelBaseEvents>>(event: Name) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).emit(event);
        this.emit("changed");
    }
}

function watchLoadState(
    olLayer: OlBaseLayer,
    onChange: (newState: LayerLoadState) => void
): { initial: LayerLoadState; resource: Resource } {
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
    let currentLoadState = mapState(currentSource?.getState());
    const updateState = () => {
        const nextLoadState = mapState(currentSource?.getState());
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
