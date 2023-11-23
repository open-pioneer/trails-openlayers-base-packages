// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import OlMap from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import olGeolocation, { GeolocationError } from "ol/Geolocation";
import Point from "ol/geom/Point";
import type { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { StyleLike } from "ol/style/Style";
import { Polygon } from "ol/geom";
import { Coordinate } from "ol/coordinate";
import { EventEmitter, createLogger } from "@open-pioneer/core";
import { TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Extent, getHeight, getWidth } from "ol/extent";

const LOG = createLogger("geolocation:GeolocationController");
const DEFAULT_BUFFER_FACTOR = 1.2;
const DEFAULT_MAX_ZOOM_LEVEL = 17;

type ErrorEvent = "permission-denied" | "position-unavailable" | "timeout" | "unknown";

interface Events {
    error: ErrorEvent;
}

export class GeolocationController extends EventEmitter<Events> {
    private readonly olMap: OlMap;
    private maxZoomLevel: number | undefined;
    private readonly positionHighlightLayer: VectorLayer<VectorSource>;
    private readonly geolocation: olGeolocation;
    private accuracyFeature: Feature | undefined;
    private positionFeature: Feature | undefined;
    private changeHandlers: EventsKey[] = [];
    private isCurrentlyActive: boolean = false;
    private setMapToPosition: boolean = true;
    private trackingOptions: PositionOptions = {};

    constructor(
        olMap: OlMap,
        maxZoomLevel?: number | undefined,
        trackingOptions?: PositionOptions
    ) {
        super();
        this.olMap = olMap;
        this.maxZoomLevel = maxZoomLevel;

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
                    if (this.setMapToPosition) {
                        const accuracyGeometryExtent: Extent | undefined = this?.accuracyFeature
                            ?.getGeometry()
                            ?.getExtent();
                        if (accuracyGeometryExtent) {
                            const bufferedExtent: number[] | undefined =
                                this.calculateBufferedExtent(accuracyGeometryExtent);
                            if (!bufferedExtent) {
                                return;
                            }
                            olMap.getView().fit(bufferedExtent, {
                                maxZoom: this.maxZoomLevel
                            });
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
                    this.setMapToPosition = false;
                });

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
    setMaxZoomLevel(maxZomLevel: number | undefined) {
        this.maxZoomLevel = maxZomLevel ?? DEFAULT_MAX_ZOOM_LEVEL;
    }

    calculateBufferedExtent(extent: Extent) {
        let bufferedExtent: number[] | undefined;
        if (extent && extent[0] && extent[1] && extent[2] && extent[3]) {
            const width = getHeight(extent);
            const height = getWidth(extent);
            const bufferWidth = width * DEFAULT_BUFFER_FACTOR;
            const bufferHeight = height * DEFAULT_BUFFER_FACTOR;

            bufferedExtent = [
                extent[0] - (bufferWidth - width) / 2,
                extent[1] - (bufferHeight - height) / 2,
                extent[2] + (bufferWidth - width) / 2,
                extent[3] + (bufferHeight - height) / 2
            ];
        }
        return bufferedExtent;
    }

    getMaxZoomLevel() {
        return this.maxZoomLevel ? this.maxZoomLevel : DEFAULT_MAX_ZOOM_LEVEL;
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
