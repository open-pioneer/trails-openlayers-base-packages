// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it, describe, afterEach, vi } from "vitest";
import {
    getDefaultPositionStyle,
    getDefaultAccuracyStyle,
    getDefaultTrackingOptions
} from "./GeolocationController";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import {
    setup,
    setupWithCustomProperties,
    getCustomPositionStyle,
    getCustomAccuracyStyle,
    mockSuccessGeolocation
} from "./test-utils";

afterEach(() => {
    vi.restoreAllMocks();
});

it("should successfully return a geolocation position", async () => {
    mockSuccessGeolocation([51.1, 45.3]);

    const { controller } = setup();
    await controller.startGeolocation();

    const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    expect(positionFeature?.getGeometry()?.getExtent()).toStrictEqual([
        5042772.932935293, 6639001.66376131, 5042772.932935293, 6639001.66376131
    ]);
});

describe("Default Properties", () => {
    it("uses the default style for the position feature", async () => {
        const { controller } = setup();
        const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
        expect(positionFeature?.getStyle()).toMatchObject(getDefaultPositionStyle());
    });
    it("uses the default style for the accuracy feature", async () => {
        const { controller } = setup();
        const accuracyFeature: Feature<Geometry> | undefined = controller.getAccuracyFeature();
        expect(accuracyFeature?.getStyle()).toMatchObject(getDefaultAccuracyStyle());
    });
    it("uses the default tracking options", async () => {
        const { controller } = setup();
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
        const { controller } = setupWithCustomProperties();
        const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
        expect(positionFeature?.getStyle()).toMatchObject(getCustomPositionStyle());
    });

    it("uses the configured style for the accuracy feature", async () => {
        const { controller } = setupWithCustomProperties();
        const accuracyFeature: Feature<Geometry> | undefined = controller.getAccuracyFeature();
        expect(accuracyFeature?.getStyle()).toMatchObject(getCustomAccuracyStyle());
    });

    it("uses the configured tracking options", async () => {
        const { controller } = setupWithCustomProperties();
        const trackingOptions: PositionOptions = controller.getTrackingOptions();
        expect(trackingOptions?.enableHighAccuracy).toBe(true);
        expect(trackingOptions?.timeout).toBe(20);
        expect(trackingOptions?.maximumAge).toBe(50);
    });
});
