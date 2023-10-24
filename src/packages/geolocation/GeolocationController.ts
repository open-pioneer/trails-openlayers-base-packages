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

export class GeolocationController {
    private olMap: olMap;
    private positionHighlightLayer: VectorLayer<VectorSource>;
    private accuracyFeature: Feature | undefined;
    private positionFeature: Feature | undefined;
    private geolocation: olGeolocation;
    private changeHandlers: EventsKey[] = [];
    private isCurrentlyActive: boolean = false;

    constructor(olMap: olMap) {
        this.olMap = olMap;

        this.accuracyFeature = new Feature();
        this.positionFeature = createFeatureWithStyle();

        this.positionHighlightLayer = new VectorLayer({
            source: new VectorSource({
                features: [this.accuracyFeature, this.positionFeature]
            })
        });

        this.geolocation = new olGeolocation({
            tracking: false,
            trackingOptions: {
                enableHighAccuracy: true,
                timeout: 30000, // todo: konfigurierbar?
                maximumAge: 2000 // todo: konfigurierbar?
            },
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
    }

    startGeolocation(olMap: olMap) {
        if (!this.isCurrentlyActive) {
            // TODO: needed?
            this.isCurrentlyActive = true;
            this.geolocation?.setProjection(olMap.getView()?.getProjection());
            this.geolocation?.setTracking(true);

            const accuracyChangeHandler = this.geolocation.on("change:accuracyGeometry", () => {
                this.accuracyFeature?.setGeometry(this.geolocation.getAccuracyGeometry());
            });

            const positionChangeHandler = this.geolocation.on("change:position", () => {
                const coordinates = this.geolocation.getPosition();
                this.positionFeature?.setGeometry(coordinates ? new Point(coordinates) : null);
                olMap.getView().setCenter(coordinates);
            });

            this.changeHandlers.push(accuracyChangeHandler, positionChangeHandler);

            // TODO: is it ok that layer is added event if error occurs currently after tracking activation?
            olMap.addLayer(this.positionHighlightLayer);
        }
    }

    stopGeolocation(olMap: olMap) {
        this.geolocation?.setTracking(false);
        this.isCurrentlyActive = false;

        this.changeHandlers.forEach((handler) => {
            unByKey(handler);
        });
        this.accuracyFeature?.setGeometry(undefined);
        this.positionFeature?.setGeometry(undefined);
        olMap.removeLayer(this.positionHighlightLayer);
    }

    getGeolocation() {
        return this.geolocation;
    }
}

const createFeatureWithStyle = () => {
    // todo: Konfigurierbar?
    const feature = new Feature();
    feature.setStyle(
        new Style({
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
        })
    );
    return feature;
};
