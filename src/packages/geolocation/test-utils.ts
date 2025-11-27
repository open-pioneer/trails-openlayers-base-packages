// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Circle, Fill, Stroke, Style } from "ol/style";
import { vi } from "vitest";
import { GeolocationController } from "./GeolocationController";
import { setupMap } from "@open-pioneer/map-test-utils";

export function mockSuccessGeolocation(coords: number[]) {
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue({
        clearWatch() {},
        getCurrentPosition() {},
        watchPosition(success) {
            setTimeout(() => {
                success({
                    coords: {
                        latitude: coords[0],
                        longitude: coords[1],
                        accuracy: 2500,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    }
                } as GeolocationPosition);
            }, 1);

            return 123;
        }
    } satisfies Partial<Geolocation>);
}

export function mockErrorGeolocation() {
    vi.spyOn(navigator, "geolocation", "get").mockReturnValue({
        clearWatch() {},
        getCurrentPosition() {},
        watchPosition(success, error) {
            setTimeout(() => {
                error?.({
                    code: 2,
                    message: "POSITION_UNAVAILABLE",
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3
                });
            }, 1);

            return 123;
        }
    } satisfies Partial<Geolocation>);
}

export async function setup() {
    const { mapId, registry, layerFactory } = await setupMap();
    const map = await registry.expectMapModel(mapId);

    return {
        map,
        controller: new GeolocationController(map, layerFactory, (error) => {
            console.error("Unexpected error", error);
        })
    };
}

export async function setupWithCustomProperties() {
    const { mapId, registry, layerFactory } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const maxZoom: number = getCustomMaxZoom();
    const positionFeatureStyle: Style = getCustomPositionStyle();
    const accuracyFeatureStyle: Style = getCustomAccuracyStyle();
    const trackingOptions: PositionOptions = getCustomTrackingOptions();

    const controller = new GeolocationController(
        map,
        layerFactory,
        (error) => {
            console.error("Unexpected error", error);
        },
        trackingOptions
    );
    controller.setMaxZoom(maxZoom);
    controller.setPositionFeatureStyle(positionFeatureStyle);
    controller.setAccuracyFeatureStyle(accuracyFeatureStyle);
    return {
        map,
        controller
    };
}

export function getCustomMaxZoom() {
    return 20;
}
export function getCustomPositionStyle() {
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

export function getCustomAccuracyStyle() {
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
