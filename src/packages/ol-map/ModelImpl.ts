// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    EventEmitter,
    ManualPromise,
    createAbortError,
    createLogger,
    createManualPromise,
    isAbortError
} from "@open-pioneer/core";
import {
    ExtentConfig,
    LayerCollection,
    LayerCollectionEvents,
    LayerConfig,
    LayerLoadState,
    LayerModel,
    LayerModelEvents,
    MapModel,
    MapModelEvents
} from "./api";
import OlMap from "ol/Map";
import OlBaseLayer from "ol/layer/Base";
import { v4 as uuid4v } from "uuid";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { getCenter } from "ol/extent";

const LOG = createLogger("ol-map:Model");

export class MapModelImpl extends EventEmitter<MapModelEvents> implements MapModel {
    readonly #id: string;
    readonly #olMap: OlMap;
    readonly #layers = new LayerCollectionImpl(this);
    #container: HTMLDivElement | undefined;
    #initialExtent: ExtentConfig | undefined;

    readonly #abortController = new AbortController();
    #displayStatus: "waiting" | "ready" | "error";
    #displayWaiter: ManualPromise<void> | undefined;

    constructor(properties: { id: string; olMap: OlMap; initialExtent: ExtentConfig | undefined }) {
        super();
        this.#id = properties.id;
        this.#olMap = properties.olMap;
        this.#initialExtent = properties.initialExtent;

        this.#displayStatus = "waiting";
        this.#waitForView().then(
            () => {
                this.#displayStatus = "ready";
                this.#displayWaiter?.resolve();
                this.#displayWaiter = undefined;
            },
            (error) => {
                if (!isAbortError(error)) {
                    LOG.error(`Failed to initialize map`, error);
                }

                this.#displayStatus = "error";
                this.#displayWaiter?.reject(new Error(`Failed to initialize map.`));
                this.#displayWaiter = undefined;
            }
        );
    }

    destroy() {
        this.#abortController.abort();
        this.#displayWaiter?.reject(createAbortError());
        this.#layers.destroy();
        this.#olMap.dispose();
    }

    get id(): string {
        return this.#id;
    }

    get olMap(): OlMap {
        return this.#olMap;
    }

    get layers(): LayerCollectionImpl {
        return this.#layers;
    }

    get container(): HTMLDivElement | undefined {
        return this.#container;
    }

    get initialExtent(): ExtentConfig | undefined {
        return this.#initialExtent;
    }

    whenDisplayed(): Promise<void> {
        if (this.#displayStatus === "ready") {
            return Promise.resolve();
        }
        if (this.#displayStatus === "error") {
            return Promise.reject(new Error(`Failed to initialize map.`));
        }
        return (this.#displayWaiter ??= createManualPromise()).promise;
    }

    // Called by the UI implementation when the map is mounted
    __setContainer(container: HTMLDivElement | undefined): void {
        if (container !== this.#container) {
            this.#container = container;
            this.emit("changed:container");
            this.emit("changed");
        }
    }

    /**
     * Waits for the map to be displayed.
     *
     * May simply resolve when done, or throw an error when a problem occurs.
     * AbortError is thrown when cancelled via `this.#abortController`, for example
     * when the map model is destroyed before it has ever been displayed.
     */
    async #waitForView(): Promise<void> {
        try {
            await waitForMapSize(this.olMap, this.#abortController.signal); // may throw on cancel
        } catch (e) {
            if (isAbortError(e)) {
                throw e;
            }
            throw new Error(`Failed to wait for the map to be displayed.`, { cause: e });
        }

        try {
            const olMap = this.#olMap;
            const view = olMap.getView();

            if (this.#initialExtent) {
                // Initial extent was set from the outside. We simply ensure that it gets displayed by the map.
                const extent = this.#initialExtent;
                const olExtent = [extent.xMin, extent.yMin, extent.xMax, extent.yMax];

                const olCenter = getCenter(olExtent);
                const resolution = view.getResolutionForExtent(olExtent);
                LOG.debug(`Applying initial extent`, extent);
                LOG.debug(`  Computed center:`, olCenter);
                LOG.debug(`  Computed resolution:`, resolution);

                view.setCenter(olCenter);
                view.setResolution(resolution);
            } else {
                // Initial extent was NOT set from the outside.
                // We detect whatever the view is displaying and consider it to be the initial extent.
                const olExtent = view.calculateExtent();
                const [xMin = 0, yMin = 0, xMax = 0, yMax = 0] = olExtent;
                const extent: ExtentConfig = { xMin, yMin, xMax, yMax };
                LOG.debug(`Detected initial extent`, extent);

                this.#initialExtent = extent;
                this.emit("changed:initialExtent");
                this.emit("changed");
            }
        } catch (e) {
            throw new Error(`Failed to apply the initial extent.`, { cause: e });
        }
    }
}

export class LayerCollectionImpl
    extends EventEmitter<LayerCollectionEvents>
    implements LayerCollection
{
    #map: MapModelImpl;
    #layerModelsById = new Map<string, LayerModelImpl>();
    #layerModelsByLayer: WeakMap<OlBaseLayer, LayerModelImpl> | undefined = undefined;
    #activeBaseLayer: LayerModelImpl | undefined;

    constructor(map: MapModelImpl) {
        super();
        this.#map = map;
    }

    get map(): MapModel {
        return this.#map;
    }

    destroy() {
        // Collection is destroyed together with the map, there is no need to clean up the olMap
        for (const layerModel of this.#layerModelsById.values()) {
            layerModel.destroy();
        }
        this.#layerModelsById.clear();
        this.#layerModelsByLayer = undefined;
        this.#activeBaseLayer = undefined;
    }

    createLayer(config: LayerConfig): LayerModelImpl {
        LOG.debug(`Creating layer`, config);

        const resolvedConfig: Required<LayerConfig> = {
            id: this.#getLayerId(config.id),
            layer: config.layer,
            attributes: config.attributes ?? {},
            title: config.title ?? "",
            description: config.description ?? "",
            isBaseLayer: config.isBaseLayer ?? false
        };
        const model = new LayerModelImpl(this.#map, resolvedConfig);
        try {
            this.#registerLayer(model);

            LOG.debug("Created layer model", model);
            return model;
        } catch (e) {
            model.destroy();
            throw e;
        }
    }

    #registerLayer(model: LayerModelImpl) {
        const id = model.id;
        const olLayer = model.olLayer;
        if (this.#layerModelsById.has(id)) {
            throw new Error(`Layer with id '${id}' is already registered.`);
        }
        if (this.#layerModelsByLayer?.has(olLayer)) {
            throw new Error(`OlLayer has already been used for a different LayerModel.`);
        }

        this.#map.olMap.addLayer(olLayer);
        this.#layerModelsById.set(id, model);
        (this.#layerModelsByLayer ??= new WeakMap()).set(olLayer, model);
        this.emit("changed");
    }

    #getLayerId(id: string | undefined): string {
        if (id != null) {
            if (this.#layerModelsById.has(id)) {
                throw new Error(
                    `Layer id '${id}' is not unique. Either assign a unique id or skip the id property to generate an automatic id.`
                );
            }
            return id;
        }

        return uuid4v();
    }

    getBaseLayers(): LayerModelImpl[] {
        return this.getAllLayers().filter((layerModel) => layerModel.isBaseLayer);
    }

    getActiveBaseLayer(): LayerModelImpl | undefined {
        return this.#activeBaseLayer;
    }

    activateBaseLayer(id: string): boolean {
        const newBaseLayer = this.#layerModelsById.get(id);
        if (!newBaseLayer) {
            LOG.warn(`Cannot activate base layer '${id}': layer is unknown.`);
            return false;
        }
        if (!newBaseLayer.isBaseLayer) {
            LOG.warn(`Cannot activate base layer '${id}': layer is not a base layer.`);
            return false;
        }

        this.#updateBaseLayer(newBaseLayer);
        this.emit("changed");
        return true;
    }

    getOperationalLayers(): LayerModelImpl[] {
        return this.getAllLayers().filter((layerModel) => !layerModel.isBaseLayer);
    }

    getLayerById(id: string): LayerModelImpl | undefined {
        return this.#layerModelsById.get(id);
    }

    getAllLayers(): LayerModelImpl[] {
        return Array.from(this.#layerModelsById.values());
    }

    removeLayerById(id: string): void {
        const model = this.#layerModelsById.get(id);
        if (!model) {
            LOG.isDebug() && LOG.debug(`Cannot remove layer '${id}': layer is unknown.`);
            return;
        }

        this.#map.olMap.removeLayer(model.olLayer);
        this.#layerModelsById.delete(id);
        this.#layerModelsByLayer?.delete(model.olLayer);
        if (this.#activeBaseLayer === model) {
            this.#updateBaseLayer(this.getBaseLayers()[0]);
        }
        model.destroy();
        this.emit("changed");
    }

    getLayerByRawInstance(layer: OlBaseLayer): LayerModel | undefined {
        return this.#layerModelsByLayer?.get(layer);
    }

    #updateBaseLayer(model: LayerModelImpl | undefined) {
        if (this.#activeBaseLayer === model) {
            return;
        }

        this.#activeBaseLayer?.olLayer.setVisible(false);
        this.#activeBaseLayer = model;
        this.#activeBaseLayer?.olLayer.setVisible(true);
    }
}

export class LayerModelImpl extends EventEmitter<LayerModelEvents> implements LayerModel {
    #id: string;
    #map: MapModelImpl;
    #olLayer: OlBaseLayer;
    #isBaseLayer: boolean;
    #attributes: Record<string | symbol, unknown>;

    #title: string;
    #description: string;

    #loadState: LayerLoadState;
    #loadError: Error | undefined;

    constructor(map: MapModelImpl, config: Required<LayerConfig>) {
        super();
        this.#id = config.id;
        this.#map = map;
        this.#olLayer = config.layer;
        this.#isBaseLayer = config.isBaseLayer;
        this.#attributes = config.attributes;
        this.#title = config.title;
        this.#description = config.description;

        // TODO: Initialize state, if possible, from layer and watch for error events
        // Otherwise, if not possible (e.g. for certain layer types), just assume "loaded"
        // hint: layer.source.state, or error events?
        this.#loadState = "not-loaded";
        this.#loadError = undefined;
    }

    get id(): string {
        return this.#id;
    }

    get map(): MapModel {
        return this.#map;
    }

    get olLayer(): OlBaseLayer {
        return this.#olLayer;
    }

    get isBaseLayer(): boolean {
        return this.#isBaseLayer;
    }

    get attributes(): Record<string | symbol, unknown> {
        return this.#attributes;
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

    get loadError(): Error | undefined {
        return this.#loadError;
    }

    destroy() {
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

    #emitChangeEvent<Name extends keyof LayerModelEvents>(event: Name) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).emit(event);
        this.emit("changed");
    }
}

function waitForMapSize(olMap: OlMap, signal: AbortSignal): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
        let eventKey: EventsKey | undefined;

        function checkSize() {
            const currentSize = olMap.getSize() ?? [];
            const [width = 0, height = 0] = currentSize;
            if (currentSize && width > 0 && height > 0) {
                finish();
            }
        }

        function onAbort() {
            finish(createAbortError());
        }

        function finish(error?: Error | undefined) {
            if (eventKey) {
                unByKey(eventKey);
                eventKey = undefined;
            }
            signal.removeEventListener("abort", onAbort);

            if (error) {
                reject();
            } else {
                resolve(wait(25)); // Give the map some time to render
            }
        }

        if (signal.aborted) {
            finish(createAbortError());
            return;
        }

        signal.addEventListener("abort", onAbort);
        eventKey = olMap.on("change:size", checkSize);
    });
    return promise;
}

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
