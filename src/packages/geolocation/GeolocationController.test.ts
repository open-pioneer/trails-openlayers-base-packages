// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it, describe } from "vitest";
import {
    GeolocationController,
    getDefaultPositionStyle,
    getDefaultAccuracyStyle,
    getDefaultTrackingOptions
} from "./GeolocationController";
import OlMap from "ol/Map";
import olMap from "ol/Map";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

/**
 * Todo Test:
 * Generelles testen, ob eine Position zurückkommt
 * Fehlerfall testen
 * Karte verschieben bzw. Zoomstufe ändern und Testen, ob sich der Kartenmittelpunkt nicht aktualisiert (this.centerMapToPosition = false)
 */

describe("Default Properties", () => {
    it("uses the default style for the position feature", async () => {
        const controller: GeolocationController = setup();
        const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
        expect(positionFeature?.getStyle()).toMatchObject(getDefaultPositionStyle());
    });
    it("uses the default style for the accuracy feature", async () => {
        const controller: GeolocationController = setup();
        const accuracyFeature: Feature<Geometry> | undefined = controller.getAccuracyFeature();
        expect(accuracyFeature?.getStyle()).toMatchObject(getDefaultAccuracyStyle());
    });
    it("uses the default tracking options", async () => {
        const controller: GeolocationController = setup();
        const trackingOptions: PositionOptions = controller.getTrackingOptions();
        expect(trackingOptions?.enableHighAccuracy).toBe(
            getDefaultTrackingOptions()?.enableHighAccuracy?.valueOf()
        );
        expect(trackingOptions?.timeout).toBe(getDefaultTrackingOptions()?.timeout?.valueOf());
        expect(trackingOptions?.maximumAge).toBe(
            getDefaultTrackingOptions()?.maximumAge?.valueOf()
        );
    });
});

describe("Custom Properties", () => {
    it("uses the configured style for the position feature", async () => {
        const controller: GeolocationController = setupWithCustomProperties();
        const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
        expect(positionFeature?.getStyle()).toMatchObject(getCustomPositionStyle());
    });

    it("uses the configured style for the accuracy feature", async () => {
        const controller: GeolocationController = setupWithCustomProperties();
        const accuracyFeature: Feature<Geometry> | undefined = controller.getAccuracyFeature();
        expect(accuracyFeature?.getStyle()).toMatchObject(getCustomAccuracyStyle());
    });

    it("uses the configured tracking options", async () => {
        const controller: GeolocationController = setupWithCustomProperties();
        const trackingOptions: PositionOptions = controller.getTrackingOptions();
        expect(trackingOptions?.enableHighAccuracy).toBe(true);
        expect(trackingOptions?.timeout).toBe(20);
        expect(trackingOptions?.maximumAge).toBe(50);
    });
});

function setup() {
    const olMap: olMap = new OlMap();
    return new GeolocationController(olMap);
}

function setupWithCustomProperties() {
    const olMap: olMap = new OlMap();
    const positionFeatureStyle: Style = getCustomPositionStyle();
    const accuracyFeatureStyle: Style = getCustomAccuracyStyle();
    const trackingOptions: PositionOptions = getCustomTrackingOptions();

    return new GeolocationController(
        olMap,
        positionFeatureStyle,
        accuracyFeatureStyle,
        trackingOptions
    );
}

function getCustomPositionStyle() {
    return new Style({
        image: new Circle({
            fill: new Fill({
                color: "rgba(255,255,255,0.4)"
            }),
            stroke: new Stroke({
                color: "#3399CC",
                width: 1.25
            }),
            radius: 5
        }),
        fill: new Fill({
            color: "rgba(255,255,255,0.4)"
        }),
        stroke: new Stroke({
            color: "#3399CC",
            width: 1.25
        })
    });
}

function getCustomAccuracyStyle() {
    return new Style({
        image: new Circle({
            fill: new Fill({
                color: "rgba(255,255,255,0.4)"
            }),
            stroke: new Stroke({
                color: "#3399CC",
                width: 1.25
            }),
            radius: 5
        }),
        fill: new Fill({
            color: "rgba(255,255,255,0.4)"
        }),
        stroke: new Stroke({
            color: "#3399CC",
            width: 1.25
        })
    });
}

function getCustomTrackingOptions() {
    return {
        "enableHighAccuracy": true,
        "timeout": 20,
        "maximumAge": 50
    };
}
