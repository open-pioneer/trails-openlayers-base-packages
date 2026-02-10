// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, reactive, ReadonlyReactive, synchronized } from "@conterra/reactivity-core";
import { emit, emitter, EventSource } from "@conterra/reactivity-events";
import type { Resource } from "@open-pioneer/core";
import {
    createAbortError,
    createLogger,
    createManualPromise,
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
import type { StyleLike } from "ol/style/Style";
import { sourceId } from "open-pioneer:source-info";
import { LAYER_DEPS, LayerDependencies } from "../layers/shared/internals";
import type { BaseFeature } from "../utils/BaseFeature";
import {
    assertInternalConstructor,
    INTERNAL_CONSTRUCTOR_TAG,
    InternalConstructorTag
} from "../utils/InternalConstructorTag";
import { Highlights } from "./Highlights";
import { LayerCollection } from "./LayerCollection";
import { ExtentConfig } from "./MapConfig";
import { Overlays } from "./Overlays";

const LOG = createLogger(sourceId);

const DEFAULT_DPI = 25.4 / 0.28;
const INCHES_PER_METRE = 39.37;

/**
 * Style options supported when creating a new {@link Highlight}.
 *
 * @group Map Model
 **/
export interface HighlightOptions {
    /**
     * Optional styles to override the default styles.
     */
    highlightStyle?: HighlightStyle;
}

/**
 * Zoom options supported when creating a new {@link Highlight}.
 *
 * @group Map Model
 **/
export interface ZoomOptions {
    /**
     * The zoom-level used if there is no valid extend (such as for single points).
     */
    pointZoom?: number;

    /**
     * The maximum zoom-level for multiple points, line or polygon results.
     */
    maxZoom?: number;

    /**
     * The view padding to make all features visible.
     */
    viewPadding?: MapPadding;

    /**
     * The buffer factor around the extent of the zoomed features. E.g. a value of 1.1 will add
     * 10% to specify the size increase of the extent's width and height.
     */
    buffer?: number;
}

/**
 * Options supported by the map model's {@link MapModel.highlightAndZoom | highlightAndZoom} method.
 *
 * @group Map Model
 **/
export interface HighlightZoomOptions extends HighlightOptions, ZoomOptions {}

/**
 * Custom styles when creating a new {@link Highlight}.
 *
 * @group Map Model
 */
export type HighlightStyle = {
    Point?: StyleLike;
    LineString?: StyleLike;
    Polygon?: StyleLike;
    MultiPolygon?: StyleLike;
    MultiPoint?: StyleLike;
    MultiLineString?: StyleLike;
};

/**
 * Map padding, all values are pixels.
 *
 * See https://openlayers.org/en/latest/apidoc/module-ol_View-View.html#padding
 *
 * @group Map Model
 */
export interface MapPadding {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

/**
 * Represents the additional graphical representations of objects.
 *
 * See also {@link MapModel.highlight}.
 *
 * @group Map Model
 */
export interface Highlight extends Resource {
    readonly isActive: boolean;
}

/**
 * Represents an object in the map.
 *
 * @group Map Model
 */
export type DisplayTarget = BaseFeature | Geometry;

/**
 * Represents a map.
 *
 * @group Map Model
 */
export class MapModel {
    readonly #id: string;
    readonly #olMap: OlMap;
    readonly #olView: ReadonlyReactive<OlView>;
    readonly #layers = new LayerCollection(this, INTERNAL_CONSTRUCTOR_TAG);
    readonly #highlights: Highlights;
    readonly #tooltips: Overlays;
    readonly #layerDeps: LayerDependencies;
    readonly #destroyed = emitter();

    #loadStartEventHandler: EventsKey | undefined;
    #loadEndEventHandler: EventsKey | undefined;
    readonly #olLoading = reactive(false);

    #isDestroyed = false;
    #container: ReadonlyReactive<HTMLElement | undefined>;
    #initialExtent = reactive<ExtentConfig>();
    #viewBindings: ReadonlyReactive<ViewBindings>;
    #scale: ReadonlyReactive<number | undefined>;

    readonly #abortController = new AbortController();
    #displayStatus: "waiting" | "ready" | "error";
    #displayWaiter: ManualPromise<void> | undefined;

    /**
     * @internal
     */
    constructor(
        properties: {
            id: string;
            olMap: OlMap;
            initialExtent: ExtentConfig | undefined;
            httpService: HttpService;
        },
        tag: InternalConstructorTag
    ) {
        assertInternalConstructor(tag);

        this.#id = properties.id;
        this.#olMap = properties.olMap;
        this.#olView = synchronized(
            () => this.#olMap.getView(),
            (cb) => {
                const key = this.#olMap.on("change:view", cb);
                return () => unByKey(key);
            }
        );

        // NOTE: As early as possible (before any async actions) so we don't miss any events.
        this.#watchLoadingState();

        this.#initialExtent.value = properties.initialExtent;
        this.#layerDeps = {
            httpService: properties.httpService
        };

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

        // expects fully constructed mapModel
        this.#highlights = new Highlights(this, this.#layerDeps);
        this.#tooltips = new Overlays(this);
    }

    /**
     * Destroys this objects, including all layers, highlights and the OL map itself.
     */
    destroy() {
        if (this.#isDestroyed) {
            return;
        }

        this.#isDestroyed = true;
        try {
            emit(this.#destroyed);
        } catch (e) {
            LOG.warn(`Unexpected error from event listener during map model destruction:`, e);
        }

        this.#loadStartEventHandler && unByKey(this.#loadStartEventHandler);
        this.#loadStartEventHandler = undefined;
        this.#loadEndEventHandler && unByKey(this.#loadEndEventHandler);
        this.#loadEndEventHandler = undefined;

        this.#abortController.abort();
        this.#displayWaiter?.reject(new Error("Map model was destroyed."));
        this.#layers.destroy();
        this.#highlights.destroy();
        this.#olMap.dispose();
    }

    /**
     * Emitted when the map model is destroyed.
     */
    get destroyed(): EventSource<void> {
        return this.#destroyed;
    }

    /**
     * The unique id of the map.
     */
    get id(): string {
        return this.#id;
    }

    /**
     * The initial map extent.
     *
     * May be undefined before the map is shown.
     * This is guaranteed to be initialized if the promise returned by {@link whenDisplayed} has resolved.
     */
    get initialExtent(): ExtentConfig | undefined {
        return this.#initialExtent.value;
    }

    /**
     * Returns the current projection of the map (reactive).
     */
    get projection(): Projection {
        return this.#viewBindings.value.projection;
    }

    /**
     * Returns the current center of the map.
     * Same as `olView.getCenter()`, but reactive.
     */
    get center(): Coordinate | undefined {
        return this.#viewBindings.value.center.value;
    }

    /**
     * Returns the current resolution of the map.
     * Same as `olView.getResolution()`, but reactive.
     */
    get resolution(): number | undefined {
        return this.#viewBindings.value.resolution.value;
    }

    /**
     * Returns the current zoom level of the map.
     * Same as `olView.getZoom()`, but reactive.
     */
    get zoomLevel(): number | undefined {
        return this.#viewBindings.value.zoom.value;
    }

    /**
     * Returns the current scale of the map.
     *
     * The scale is a value derived from the current `center`, `resolution` and `projection` of the map.
     * The scale will change when the map is zoomed in our out, but depending on the projection, it may also
     * change when the map is _panned_.
     *
     * > NOTE: Technically, this is the _denominator_ of the current scale.
     * > In order to display it, use a format like `1:${scale}`.
     */
    get scale(): number | undefined {
        return this.#scale.value;
    }

    /**
     * Returns true if the map is currently loading.
     *
     * This is based on the OpenLayers events `loadstart` and `loadend`,
     * see [Documentation](https://openlayers.org/en/latest/apidoc/module-ol_MapEvent-MapEvent.html#event:loadstart).
     */
    get loading(): boolean {
        return this.#olLoading.value;
    }

    /**
     * Contains all known layers of this map.
     *
     * Note that not all layers in this collection may be active in the OpenLayers map.
     * Also note that not all layers in the OpenLayers map may be contained in this collection.
     */
    get layers(): LayerCollection {
        return this.#layers;
    }

    /**
     * The container in which the map is currently being rendered.
     * This is the same as the target element of the underlying OpenLayers map.
     *
     * May be undefined if the map is not being rendered at the moment.
     * May change at runtime.
     */
    get container(): HTMLElement | undefined {
        return this.#container.value;
    }

    /**
     * The raw OpenLayers map.
     */
    get olMap(): OlMap {
        return this.#olMap;
    }

    /**
     * Returns the current view of the OpenLayers map.
     */
    get olView(): OlView {
        return this.#olView.value;
    }

    /**
     * TODO: Can be removed once the LayerFactory is the only supported way of constructing a layer.
     *
     * @internal
     */
    get [LAYER_DEPS](): LayerDependencies {
        return this.#layerDeps;
    }

    get overlays(): Overlays {
        return this.#tooltips;
    }

    /**
     * Changes the current scale of the map to the given value.
     *
     * Internally, this computes a new zoom level / resolution based on the scale
     * and the current center.
     * The new resolution is then applied to the current `olView`.
     *
     * See also {@link scale}.
     */
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

    /**
     * Creates a highlight at the given targets.
     *
     * A highlight is a temporary graphic on the map that calls attention to a point or an area.
     *
     * Call `destroy()` on the returned highlight object to remove the highlight again.
     */
    highlight(geometries: DisplayTarget[], options?: HighlightOptions | undefined): Highlight {
        return this.#highlights.addHighlight(geometries, options);
    }

    /**
     * Zooms to the given targets.
     */
    zoom(geometries: DisplayTarget[], options?: ZoomOptions | undefined): void {
        this.#highlights.zoomToHighlight(geometries, options);
    }

    /**
     * Creates a highlight and zooms to the given targets.
     *
     * See also {@link highlight} and {@link zoom}.
     */
    highlightAndZoom(geometries: DisplayTarget[], options?: HighlightZoomOptions) {
        return this.#highlights.addHighlightAndZoom(geometries, options ?? {});
    }

    /**
     * Removes any existing highlights from the map.
     */
    removeHighlights() {
        this.#highlights.clearHighlight();
    }

    /**
     * Returns a promise that resolves when the map has mounted in the DOM.
     */
    whenDisplayed(): Promise<void> {
        if (this.#isDestroyed) {
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

    /**
     * Subscribes to the OpenLayers loading state.
     */
    #watchLoadingState() {
        this.#loadStartEventHandler = this.#olMap.on("loadstart", () => {
            this.#olLoading.value = true;
        });
        this.#loadEndEventHandler = this.#olMap.on("loadend", () => {
            this.#olLoading.value = false;
        });
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
