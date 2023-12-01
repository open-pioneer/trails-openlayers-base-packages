// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, createLogger } from "@open-pioneer/core";
import { TOPMOST_LAYER_Z, calculateBufferedExtent } from "@open-pioneer/map";
import Feature from "ol/Feature";
import olGeolocation, { GeolocationError } from "ol/Geolocation";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import type { EventsKey } from "ol/events";
import { Extent } from "ol/extent";
import { Polygon } from "ol/geom";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { StyleLike } from "ol/style/Style";

const LOG = createLogger("geolocation:GeolocationController");
const DEFAULT_MAX_ZOOM = 17;

type ErrorEvent = "permission-denied" | "position-unavailable" | "timeout" | "unknown";

interface Events {
    error: ErrorEvent;
}

export class GeolocationController extends EventEmitter<Events> {
    private readonly olMap: OlMap;
    private readonly positionHighlightLayer: VectorLayer<VectorSource>;
    private readonly geolocation: olGeolocation;
    private maxZoom: number = DEFAULT_MAX_ZOOM;
    private accuracyFeature: Feature | undefined;
    private positionFeature: Feature | undefined;
    private changeHandlers: EventsKey[] = [];
    private isCurrentlyActive: boolean = false;
    private setMapToPosition: boolean = true;
    private trackingOptions: PositionOptions = {};
    private isInitialZoom: boolean = true;

    constructor(olMap: OlMap, trackingOptions?: PositionOptions) {
        super();
        this.olMap = olMap;
        this.isInitialZoom = true;

        this.accuracyFeature = new Feature();
        this.accuracyFeature.setStyle(getDefaultAccuracyStyle());

        this.positionFeature = new Feature();
        this.positionFeature.setStyle(getDefaultPositionStyle());

        this.positionHighlightLayer = new VectorLayer({
            source: new VectorSource({
                features: [this.accuracyFeature, this.positionFeature]
            })
        });
        this.positionHighlightLayer.setZIndex(TOPMOST_LAYER_Z);

        const geolocationTrackingOptions: PositionOptions =
            trackingOptions || getDefaultTrackingOptions();

        this.geolocation = new olGeolocation({
            tracking: false,
            trackingOptions: geolocationTrackingOptions,
            projection: olMap.getView()?.getProjection()
        });

        this.trackingOptions = geolocationTrackingOptions;
        this.geolocation.on("error", (event) => this.handleGeolocationError(event));
    }

    destroy() {
        this.stopGeolocation();
        this.geolocation?.setTracking(false);
        this.geolocation.dispose();
        this.accuracyFeature = undefined;
        this.positionFeature = undefined;
        this.positionHighlightLayer.dispose();
    }

    startGeolocation(): Promise<void> {
        if (this.isCurrentlyActive) {
            return Promise.resolve();
        }

        const olMap = this.olMap;
        const geolocationPromise = new Promise<void>((resolve) => {
            this.isCurrentlyActive = true;
            this.geolocation?.setProjection(olMap.getView()?.getProjection());
            this.geolocation?.setTracking(true);

            const accuracyChangeHandler: EventsKey = this.geolocation.on(
                "change:accuracyGeometry",
                () => {
                    const accuracyGeometry: Polygon | undefined =
                        this.geolocation.getAccuracyGeometry() || undefined;
                    this.accuracyFeature?.setGeometry(accuracyGeometry);
                    if (this.accuracyFeature?.getGeometry() !== undefined) {
                        resolve();
                    }
                    if (this.isInitialZoom) {
                        const accuracyGeometryExtent: Extent | undefined = this?.accuracyFeature
                            ?.getGeometry()
                            ?.getExtent();
                        if (accuracyGeometryExtent) {
                            const bufferedExtent = calculateBufferedExtent(accuracyGeometryExtent);
                            if (!bufferedExtent) {
                                return;
                            }
                            olMap.getView().fit(bufferedExtent, {
                                maxZoom: this.maxZoom
                            });
                            this.isInitialZoom = false;
                        }
                    }
                }
            );

            const positionChangeHandler: EventsKey = this.geolocation.on("change:position", () => {
                const coordinates: Coordinate | undefined = this.geolocation.getPosition();
                if (coordinates && (coordinates[0] || coordinates[1]) !== undefined) {
                    this.positionFeature?.setGeometry(new Point(coordinates));
                    if (this.setMapToPosition) {
                        olMap.getView().setCenter(coordinates);
                    }
                    if (this.positionFeature?.getGeometry() !== undefined) {
                        resolve();
                    }
                }
            });

            // zoom changes
            const resolutionChangeHandler: EventsKey = olMap
                .getView()
                .on("change:resolution", () => {
                    this.setMapToPosition = this.isInitialZoom;
                });

            // pointermove is triggered when a pointer is moved.
            // Note that on touch devices this is triggered when the map is panned,
            // so is not the same as mousemove.
            const draggingHandler: EventsKey = olMap.on("pointermove", (evt) => {
                if (evt.dragging) {
                    this.setMapToPosition = false;
                }
            });

            this.changeHandlers.push(
                accuracyChangeHandler,
                positionChangeHandler,
                resolutionChangeHandler,
                draggingHandler
            );

            olMap.addLayer(this.positionHighlightLayer);
        });

        return geolocationPromise.catch((error: Error) => {
            LOG.error("Failed to determine location", error);
        });
    }

    stopGeolocation() {
        this.geolocation?.setTracking(false);
        this.isCurrentlyActive = false;
        this.trackingOptions = {};
        this.setMapToPosition = true;
        this.isInitialZoom = true;

        this.changeHandlers.forEach((handler) => {
            unByKey(handler);
        });
        this.changeHandlers = [];
        this.accuracyFeature?.setGeometry(undefined);
        this.positionFeature?.setGeometry(undefined);
        this.olMap.removeLayer(this.positionHighlightLayer);
    }

    setPositionFeatureStyle(styleLike: StyleLike | undefined) {
        this.positionFeature?.setStyle(styleLike ?? getDefaultPositionStyle());
    }

    setAccuracyFeatureStyle(styleLike: StyleLike | undefined) {
        this.accuracyFeature?.setStyle(styleLike ?? getDefaultAccuracyStyle());
    }

    setMaxZoom(maxZoom: number | undefined) {
        this.maxZoom = maxZoom ?? DEFAULT_MAX_ZOOM;
    }

    getMaxZoom() {
        return this.maxZoom;
    }

    getPositionFeature() {
        return this.positionFeature;
    }

    getAccuracyFeature() {
        return this.accuracyFeature;
    }

    getTrackingOptions() {
        return this.trackingOptions;
    }

    getGeolocation() {
        return this.geolocation;
    }

    private handleGeolocationError(event: GeolocationError) {
        LOG.error("Error from geolocation API:", event.message);

        const error: ErrorEvent = (() => {
            switch (event.code) {
                case 1:
                    return "permission-denied";
                case 2:
                    return "position-unavailable";
                case 3:
                    return "timeout";
                default:
                    return "unknown";
            }
        })();
        this.emit("error", error);
    }
}

export const getDefaultPositionStyle = () => {
    return new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({
                color: "#3399CC"
            }),
            stroke: new Stroke({
                color: "#fff",
                width: 2
            })
        })
    });
};

export const getDefaultAccuracyStyle = () => {
    return new Style({
        stroke: new Stroke({
            color: "#3399CC",
            width: 3
        }),
        fill: new Fill({
            color: "rgba(0, 0, 255, 0.05)"
        })
    });
};

export const getDefaultTrackingOptions = (): PositionOptions => {
    return {
        "enableHighAccuracy": true,
        "timeout": 60000,
        "maximumAge": 600000
    };
};
