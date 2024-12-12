// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, reactive, ReadonlyReactive, synchronized } from "@conterra/reactivity-core";
import {
    createAbortError,
    createLogger,
    createManualPromise,
    EventEmitter,
    isAbortError,
    ManualPromise
} from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import OlView from "ol/View";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { getCenter } from "ol/extent";
import { Geometry } from "ol/geom";
import { getPointResolution, Projection } from "ol/proj";
import {
    ExtentConfig,
    Highlight,
    HighlightOptions,
    HighlightZoomOptions,
    MapModel,
    MapModelEvents
} from "../api";
import { Highlights } from "./Highlights";
import { LayerCollectionImpl } from "./LayerCollectionImpl";

const LOG = createLogger("map:MapModel");

const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;

/**
 * Shared services or other entities propagated from the map model to all layer instances.
 */
export interface SharedDependencies {
    httpService: HttpService;
}

export class MapModelImpl extends EventEmitter<MapModelEvents> implements MapModel {
    readonly #id: string;
    readonly #olMap: OlMap;
    readonly #olView: ReadonlyReactive<OlView>;
    readonly #layers = new LayerCollectionImpl(this);
    readonly #highlights: Highlights;
    readonly #sharedDeps: SharedDependencies;

    #destroyed = false;
    #container: ReadonlyReactive<HTMLElement | undefined>;
    #initialExtent = reactive<ExtentConfig>();
    #viewBindings: ReadonlyReactive<ViewBindings>;
    #scale: ReadonlyReactive<number | undefined>;

    readonly #abortController = new AbortController();
    #displayStatus: "waiting" | "ready" | "error";
    #displayWaiter: ManualPromise<void> | undefined;

    constructor(properties: {
        id: string;
        olMap: OlMap;
        initialExtent: ExtentConfig | undefined;
        httpService: HttpService;
    }) {
        super();
        this.#id = properties.id;
        this.#olMap = properties.olMap;
        this.#olView = synchronized(
            () => this.#olMap.getView(),
            (cb) => {
                const key = this.#olMap.on("change:view", cb);
                return () => unByKey(key);
            }
        );
        this.#initialExtent.value = properties.initialExtent;
        this.#sharedDeps = {
            httpService: properties.httpService
        };
        this.#highlights = new Highlights(this.#olMap);

        this.#displayStatus = "waiting";
        this.#initializeView().then(
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

        this.#container = synchronized(
            () => this.#olMap.getTargetElement() ?? undefined,
            (cb) => {
                const key = this.#olMap.on("change:target", cb);
                return () => unByKey(key);
            }
        );

        this.#viewBindings = computed(() => createViewBindings(this.#olView.value));
        this.#scale = computed(() => {
            const { projection, resolution, center } = this;
            if (projection == null || resolution == null || center == null) {
                return undefined;
            }

            /**
             * Returns the appropriate scale for the given resolution and units, see OpenLayers function getScaleForResolution()
             * https://github.com/openlayers/openlayers/blob/7fa9df03431e9e1bc517e6c414565d9f848a3132/src/ol/control/ScaleLine.js#L454C3-L454C24
             */
            const pointResolution = getPointResolution(projection, resolution, center, "m"); //point resolution in meter per pixel
            const scale = Math.round(pointResolution * INCHES_PER_METRE * DEFAULT_DPI);
            return scale;
        });
    }

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        try {
            this.emit("destroy");
        } catch (e) {
            LOG.warn(`Unexpected error from event listener during map model destruction:`, e);
        }

        this.#abortController.abort();
        this.#displayWaiter?.reject(new Error("Map model was destroyed."));
        this.#layers.destroy();
        this.#highlights.destroy();
        this.#olMap.dispose();
    }

    get id(): string {
        return this.#id;
    }

    get olMap(): OlMap {
        return this.#olMap;
    }

    get olView(): OlView {
        return this.#olView.value;
    }

    get projection(): Projection {
        return this.#viewBindings.value.projection;
    }

    get center(): Coordinate | undefined {
        return this.#viewBindings.value.center.value;
    }

    get resolution(): number | undefined {
        return this.#viewBindings.value.resolution.value;
    }

    get zoomLevel(): number | undefined {
        return this.#viewBindings.value.zoom.value;
    }

    get scale(): number | undefined {
        return this.#scale.value;
    }

    get layers(): LayerCollectionImpl {
        return this.#layers;
    }

    get container(): HTMLElement | undefined {
        return this.#container.value;
    }

    get initialExtent(): ExtentConfig | undefined {
        return this.#initialExtent.value;
    }

    get __sharedDependencies(): SharedDependencies {
        return this.#sharedDeps;
    }

    setScale(newScale: number): void {
        const view = this.olView;
        const projection = this.projection;
        const center = this.center;
        if (!center) {
            return;
        }

        const mpu = projection.getMetersPerUnit() ?? 1;
        const resolution = INCHES_PER_METRE * DEFAULT_DPI * mpu;
        const pointResolution = newScale / getPointResolution(projection, resolution, center);
        view.setResolution(pointResolution);
    }

    highlight(geometries: Geometry[], options?: HighlightOptions | undefined): Highlight {
        return this.#highlights.addHighlight(geometries, options);
    }

    zoom(geometries: Geometry[], options?: HighlightZoomOptions | undefined): void {
        this.#highlights.zoomToHighlight(geometries, options);
    }

    highlightAndZoom(geometries: Geometry[], options?: HighlightZoomOptions) {
        return this.#highlights.addHighlightAndZoom(geometries, options ?? {});
    }

    removeHighlights() {
        this.#highlights.clearHighlight();
    }

    whenDisplayed(): Promise<void> {
        if (this.#destroyed) {
            return Promise.reject(new Error("Map model was destroyed."));
        }
        if (this.#displayStatus === "error") {
            return Promise.reject(new Error(`Failed to initialize map.`));
        }
        if (this.#displayStatus === "ready") {
            return Promise.resolve();
        }
        return (this.#displayWaiter ??= createManualPromise()).promise;
    }

    /**
     * Waits for the map to be displayed and then initializes the view (if necessary).
     *
     * May simply resolve when done, or throw an error when a problem occurs.
     * AbortError is thrown when cancelled via `this.#abortController`, for example
     * when the map model is destroyed before it has ever been displayed.
     */
    async #initializeView(): Promise<void> {
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

            if (this.#initialExtent.value) {
                // Initial extent was set from the outside. We simply ensure that it gets displayed by the map.
                const extent = this.#initialExtent.value;
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

                this.#initialExtent.value = extent;
            }
        } catch (e) {
            throw new Error(`Failed to apply the initial extent.`, { cause: e });
        }
    }
}

interface ViewBindings {
    resolution: ReadonlyReactive<number | undefined>;
    center: ReadonlyReactive<Coordinate | undefined>;
    zoom: ReadonlyReactive<number | undefined>;
    projection: Projection; // not reactive (change view to change projection)
}

function createViewBindings(view: OlView): ViewBindings {
    return {
        resolution: synchronized(
            () => view.getResolution(),
            (cb) => {
                const key = view.on("change:resolution", cb);
                return () => unByKey(key);
            }
        ),
        center: synchronized(
            () => view.getCenter(),
            (cb) => {
                const key = view.on("change:center", cb);
                return () => unByKey(key);
            }
        ),
        zoom: synchronized(
            () => view.getZoom(),
            (cb) => {
                const key = view.on("change:resolution", cb);
                return () => unByKey(key);
            }
        ),
        projection: view.getProjection()
    };
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
                reject(error);
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
