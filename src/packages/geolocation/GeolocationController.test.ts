// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { GeolocationController } from "./GeolocationController";
import OlMap from "ol/Map";
import { Circle, Fill, Stroke, Style } from "ol/style";
import olMap from "ol/Map";

it("uses the configured style for the position feature", async () => {
    const controller = setup();
    const positionFeature = controller.getPositionFeature();
    expect(positionFeature?.getStyle()).toBe(getCustomStyle());
});

it("uses the configured style for the accuracy feature", async () => {
    const controller = setup();
    const accuracyFeature = controller.getAccuracyFeature();
    expect(accuracyFeature?.getStyle()).toBe(getCustomStyle());
});

// todo: Style-Functions und andere styleLike optionen testen?
function setup() {
    const olMap: olMap = new OlMap();
    const style: Style = getCustomStyle();
    const controller = new GeolocationController(olMap, style);

    return controller;
}

function getCustomStyle() {
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
