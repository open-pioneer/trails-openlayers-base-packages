// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import olMap from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import olGeolocation from "ol/Geolocation";
import Point from "ol/geom/Point";
import type { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { StyleLike } from "ol/style/Style";
import { Polygon } from "ol/geom";
import { Coordinate } from "ol/coordinate";
import { rejects } from "assert";

export class GeolocationController {
    private readonly positionHighlightLayer: VectorLayer<VectorSource>;
    private accuracyFeature: Feature | undefined;
    private positionFeature: Feature | undefined;
    private readonly geolocation: olGeolocation;
    private changeHandlers: EventsKey[] = [];
    private isCurrentlyActive: boolean = false;
    private centerMapToPosition: boolean = true;
    private trackingOptions: PositionOptions = {};

    constructor(
        olMap: olMap,
        positionFeatureStyle?: StyleLike,
        accuracyFeatureStyle?: StyleLike,
        trackingOptions?: PositionOptions
    ) {
        this.accuracyFeature = new Feature();
        accuracyFeatureStyle = accuracyFeatureStyle || getDefaultAccuracyStyle();
        this.accuracyFeature.setStyle(accuracyFeatureStyle);

        this.positionFeature = new Feature();
        positionFeatureStyle = positionFeatureStyle || getDefaultPositionStyle();
        this.positionFeature.setStyle(positionFeatureStyle);

        this.positionHighlightLayer = new VectorLayer({
            source: new VectorSource({
                features: [this.accuracyFeature, this.positionFeature]
            })
        });

        const geolocationTrackingOptions: PositionOptions =
            trackingOptions || getDefaultTrackingOptions();

        this.geolocation = new olGeolocation({
            tracking: false,
            trackingOptions: geolocationTrackingOptions,
            projection: olMap.getView()?.getProjection()
        });

        this.trackingOptions = geolocationTrackingOptions;
    }

    destroy() {
        this.changeHandlers.forEach((handler: EventsKey) => {
            unByKey(handler);
        });
        this.geolocation?.setTracking(false);
        this.geolocation.dispose();
        this.accuracyFeature = undefined;
        this.positionFeature = undefined;
        this.positionHighlightLayer.dispose();
        this.isCurrentlyActive = false;
        this.centerMapToPosition = true;
        this.trackingOptions = {};
    }

    startGeolocation(olMap: olMap) {
        const geolocationPromise: Promise<boolean> = new Promise((resolve) => {
            if (!this.isCurrentlyActive) {
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
                            resolve(true);
                        }
                    }
                );

                const positionChangeHandler: EventsKey = this.geolocation.on(
                    "change:position",
                    () => {
                        const coordinates: Coordinate | undefined = this.geolocation.getPosition();
                        if (coordinates && (coordinates[0] || coordinates[1]) !== undefined) {
                            this.positionFeature?.setGeometry(new Point(coordinates));
                            if (this.centerMapToPosition) {
                                olMap.getView().setCenter(coordinates);
                            }
                            if (this.positionFeature?.getGeometry() !== undefined) {
                                resolve(true);
                            }
                        }
                    }
                );

                // zoom changes
                const resolutionChangeHandler: EventsKey = olMap
                    .getView()
                    .on("change:resolution", () => {
                        this.centerMapToPosition = false;
                    });

                const draggingHandler: EventsKey = olMap.on("pointermove", (evt) => {
                    if (evt.dragging) {
                        this.centerMapToPosition = false;
                    }
                });

                this.changeHandlers.push(
                    accuracyChangeHandler,
                    positionChangeHandler,
                    resolutionChangeHandler,
                    draggingHandler
                );

                olMap.addLayer(this.positionHighlightLayer);
            }
        });

        geolocationPromise.catch((error: Error) => {
            console.error(error);
        });
        return geolocationPromise;
    }

    stopGeolocation(olMap: olMap) {
        this.geolocation?.setTracking(false);
        this.isCurrentlyActive = false;
        this.trackingOptions = {};
        this.centerMapToPosition = true;

        this.changeHandlers.forEach((handler) => {
            unByKey(handler);
        });
        this.accuracyFeature?.setGeometry(undefined);
        this.positionFeature?.setGeometry(undefined);
        olMap.removeLayer(this.positionHighlightLayer);
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
