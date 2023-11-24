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
    getCustomMaxZoom,
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

it("should calculate a buffer for a given extent", async () => {
    mockSuccessGeolocation([51.1, 45.3]);

    const extent = [5038787.353057691, 6635017.052266559, 5046758.512812894, 6642988.2134831];
    const { controller } = setup();

    const bufferedExtent: number[] | undefined = controller.calculateBufferedExtent(extent);

    if (bufferedExtent) {
        expect(bufferedExtent).toStrictEqual([
            5037990.2369360365, 6634219.936291038, 5047555.628934548, 6643785.32945862
        ]);
    }
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

    it("uses the default max zoom level", async () => {
        const { controller } = setup();
        const maxZoom: number | undefined = controller.getMaxZoom();

        expect(maxZoom).toBe(17);
    });
});

describe("Tests with custom Properties", () => {
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

    it("uses the configured max zoom level", async () => {
        const { controller } = setupWithCustomProperties();
        const maxZoom: number | undefined = controller.getMaxZoom();

        expect(maxZoom).toBe(getCustomMaxZoom());
    });
});
