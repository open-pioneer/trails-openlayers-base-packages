// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { GeolocationController } from "./GeolocationController";
import OlMap from "ol/Map";
import olMap from "ol/Map";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

it("uses the configured style for the position feature", async () => {
    const controller: GeolocationController = setup();
    const positionFeature: Feature<Geometry> | undefined = controller.getPositionFeature();
    // TODO: is toStrictEqual used correctly?
    expect(positionFeature?.getStyle()).toStrictEqual(getCustomPositionStyle());
});

it("uses the configured style for the accuracy feature", async () => {
    const controller: GeolocationController = setup();
    const accuracyFeature: Feature<Geometry> | undefined = controller.getAccuracyFeature();
    // TODO: is toStrictEqual used correctly?
    expect(accuracyFeature?.getStyle()).toStrictEqual(getCustomAccuracyStyle());
});

// todo: Style-Functions und andere styleLike optionen testen?
function setup() {
    const olMap: olMap = new OlMap();
    const positionFeatureStyle: Style = getCustomPositionStyle();
    const accuracyFeatureStyle: Style = getCustomAccuracyStyle();
    return new GeolocationController(olMap, positionFeatureStyle, accuracyFeatureStyle);
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
