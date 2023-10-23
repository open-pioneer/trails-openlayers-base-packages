// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createIntl, createIntlCache, IntlErrorCode } from "@formatjs/intl";
import { MeasurementController } from "./MeasurementController";
import OlMap from "ol/Map";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

it("should successfully start measurement, and activate or deactivate draw interaction", async () => {
    const selectedMeasurement = "distance";

    const olMap = new OlMap();
    const intl = getIntl();

    const controller = new MeasurementController(
        olMap,
        intl,
        getActiveFeatureStyle(),
        getFinishedFeatureStyle()
    );

    controller.startMeasurement(selectedMeasurement);
    let drawActivated = drawInteractionActivated(olMap);
    expect(drawActivated).toBe(true);

    controller.stopMeasurement();
    drawActivated = drawInteractionActivated(olMap);
    expect(drawActivated).toBe(false);
});
it("should add geometry on dispatching drawstart and drawend events", async () => {
    const selectedMeasurement = "distance";

    const olMap = new OlMap();
    const intl = getIntl();

    const controller = new MeasurementController(
        olMap,
        intl,
        getActiveFeatureStyle(),
        getFinishedFeatureStyle()
    );
    controller.startMeasurement(selectedMeasurement);

    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw) as
        | Draw
        | undefined;
    const layers = olMap.getLayers()?.getArray();
    if (layers?.length != 1) {
        throw new Error("number of added layers is not right. length: " + layers?.length);
    }

    const layer = layers[0] as VectorLayer<VectorSource>;
    const feature = new Feature(new LineString([[851873.959638, 6788406.37108]]));

    /* this initiates draw mode. It will dispatch a drawstart event. */
    draw?.extend(feature);

    /* Stop drawing and add the sketch feature to the target layer. 
        drawend event is dispatched before inserting the feature.
    */
    draw?.finishDrawing();

    const drawnGeometry = layer?.getSource()?.getFeatures()[0]?.getGeometry();

    expect(drawnGeometry).toBeDefined();
    expect(drawnGeometry).toBeInstanceOf(LineString);

    controller.stopMeasurement();
});

it("should show active tooltip on draw start and finished tooltip on draw end", async () => {
    const selectedMeasurement = "distance";

    const olMap = new OlMap();
    const intl = getIntl();

    const controller = new MeasurementController(
        olMap,
        intl,
        getActiveFeatureStyle(),
        getFinishedFeatureStyle()
    );
    controller.startMeasurement(selectedMeasurement);

    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw) as
        | Draw
        | undefined;

    const feature = new Feature(new LineString([[851873.959638, 6788406.37108]]));
    draw?.extend(feature);
    const activeTooltip = getTooltipElement(olMap, "measurement-active-tooltip");

    expect(activeTooltip).toBeDefined();
    expect(activeTooltip).toBeInstanceOf(HTMLElement);

    draw?.finishDrawing();
    const finishedTooltip = getTooltipElement(olMap, "measurement-finished-tooltip");

    expect(finishedTooltip).toBeDefined();
    expect(finishedTooltip).toBeInstanceOf(HTMLElement);

    controller.stopMeasurement();
});

function drawInteractionActivated(olMap: OlMap) {
    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw);
    return draw?.getActive() || false;
}

function getIntl() {
    const locale = "en";
    const defaultMessageLocale = "en";
    const cache = createIntlCache();
    const messages = {
        "tooltips.continue": "Click to continue drawing",
        "tooltips.help": "Click to start drawing"
    };
    return createIntl(
        {
            locale,
            defaultLocale: defaultMessageLocale,
            messages,
            onError: (err) => {
                if (err.code === IntlErrorCode.MISSING_TRANSLATION) {
                    return;
                }
                console.error(err);
            }
        },
        cache
    );
}

function getTooltipElement(olMap: OlMap, className: string) {
    let element;
    olMap
        .getOverlays()
        .getArray()
        .forEach((ol) => {
            if (ol.getElement()?.classList.contains(className)) {
                element = ol.getElement() as HTMLElement;
            }
        });
    return element;
}

function getActiveFeatureStyle() {
    return new Style({
        fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
        }),
        stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.5)",
            lineDash: [10, 10],
            width: 2
        }),
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
                color: "rgba(0, 0, 0, 0.7)"
            }),
            fill: new Fill({
                color: "rgba(255, 255, 255, 0.2)"
            })
        })
    });
}

function getFinishedFeatureStyle() {
    return {
        "fill-color": "rgba(255, 255, 255, 0.2)",
        "stroke-color": "#ffcc33",
        "stroke-width": 2,
        "circle-radius": 7,
        "circle-fill-color": "#ffcc33"
    };
}
