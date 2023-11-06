// SPDX-FileCopyrightText: con terra GmbH and contributors
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

export class GeolocationController {
    private olMap: olMap;
    private positionHighlightLayer: VectorLayer<VectorSource>;
    private accuracyFeature: Feature | undefined;
    private positionFeature: Feature | undefined;
    private geolocation: olGeolocation;
    private changeHandlers: EventsKey[] = [];
    private isCurrentlyActive: boolean = false;
    private centerMapToPosition: boolean = true;

    constructor(
        olMap: olMap,
        positionFeatureStyle?: StyleLike,
        accuracyFeatureStyle?: StyleLike,
        trackingOptions?: PositionOptions
    ) {
        this.olMap = olMap;

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

        // PositionOptions or trackingoptions?
        const geolocationTrackingOptions: PositionOptions =
            trackingOptions || getDefaultTrackingOptions();

        this.geolocation = new olGeolocation({
            tracking: false,
            trackingOptions: geolocationTrackingOptions,
            projection: olMap.getView()?.getProjection()
        });
    }

    destroy() {
        this.changeHandlers.forEach((handler) => {
            unByKey(handler);
        });
        this.geolocation?.setTracking(false);
        this.geolocation.dispose();
        this.accuracyFeature = undefined;
        this.positionFeature = undefined;
        this.positionHighlightLayer.dispose();
        this.isCurrentlyActive = false;
        this.centerMapToPosition = true;
    }

    startGeolocation(olMap: olMap) {
        // TODO: return new Promise {} for loadingStatus
        if (!this.isCurrentlyActive) {
            this.isCurrentlyActive = true;
            this.geolocation?.setProjection(olMap.getView()?.getProjection());
            this.geolocation?.setTracking(true);

            const accuracyChangeHandler = this.geolocation.on("change:accuracyGeometry", () => {
                const accuracyGeometry = this.geolocation.getAccuracyGeometry() || undefined;
                this.accuracyFeature?.setGeometry(accuracyGeometry);
            });

            const positionChangeHandler = this.geolocation.on("change:position", () => {
                console.log("pos changed");
                const coordinates = this.geolocation.getPosition();
                this.positionFeature?.setGeometry(coordinates ? new Point(coordinates) : undefined);
                if (this.centerMapToPosition) {
                    olMap.getView().setCenter(coordinates);
                }
            });

            // zoom changes
            const resolutionChangeHandler = olMap.getView().on("change:resolution", () => {
                this.centerMapToPosition = false;
            });

            const rotationChangeHandler = olMap.getView().on("change:rotation", () => {
                this.centerMapToPosition = false;
            });

            const draggingHandler = olMap.on("pointermove", (evt) => {
                if (evt.dragging) {
                    this.centerMapToPosition = false;
                }
            });

            this.changeHandlers.push(
                accuracyChangeHandler,
                positionChangeHandler,
                resolutionChangeHandler,
                rotationChangeHandler,
                draggingHandler
            );

            // TODO: is it ok that layer is added event if error occurs currently after tracking activation?
            olMap.addLayer(this.positionHighlightLayer);
        }
    }

    stopGeolocation(olMap: olMap) {
        this.geolocation?.setTracking(false);
        this.isCurrentlyActive = false;
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

    getGeolocation() {
        return this.geolocation;
    }
}

const getDefaultPositionStyle = () => {
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

const getDefaultAccuracyStyle = () => {
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

const getDefaultTrackingOptions = (): PositionOptions => {
    return {
        "enableHighAccuracy": true,
        "timeout": 60000,
        "maximumAge": 600000
    };
};
