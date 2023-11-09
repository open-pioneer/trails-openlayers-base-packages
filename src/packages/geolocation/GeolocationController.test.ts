// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it, describe, afterEach, vi } from "vitest";
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
import { mockGeolocation } from "./utils";

/**
 * Todo Test:
 * Fehlerfall testen -> ähnlich Punkt 1, Rückgabe error (https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError)
 * Karte verschieben bzw. Zoomstufe ändern und Testen, ob sich der Kartenmittelpunkt nicht aktualisiert (this.centerMapToPosition = false)
 */

const OL_MAP: olMap = new OlMap();

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully return a geolocation position", async () => {
    mockGeolocation();

    const controller: GeolocationController = setup();
    await controller.startGeolocation(OL_MAP);

    const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    expect(positionFeature?.getGeometry()?.getExtent()).toStrictEqual([
        5042772.932935293, 6639001.66376131, 5042772.932935293, 6639001.66376131
    ]);
});

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
    return new GeolocationController(OL_MAP);
}

function setupWithCustomProperties() {
    const positionFeatureStyle: Style = getCustomPositionStyle();
    const accuracyFeatureStyle: Style = getCustomAccuracyStyle();
    const trackingOptions: PositionOptions = getCustomTrackingOptions();

    return new GeolocationController(
        OL_MAP,
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
