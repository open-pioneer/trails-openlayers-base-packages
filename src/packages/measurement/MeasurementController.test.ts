// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { MeasurementController } from "./MeasurementController";
import OlMap from "ol/Map";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";
import LineString from "ol/geom/LineString";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { toFunction as toStyleFunction } from "ol/style/Style";
import { Geometry, Polygon } from "ol/geom";
import { Feature } from "ol";

it("should successfully start measurement, and activate or deactivate draw interaction", async () => {
    const { olMap, controller } = setup();

    controller.startMeasurement("distance");
    expect(hasActiveDrawInteraction(olMap)).toBe(true);

    controller.stopMeasurement();
    expect(hasActiveDrawInteraction(olMap)).toBe(false);
});

it("should measure a line / distance", async () => {
    const { olMap, controller } = setup();
    const layer = controller.getVectorLayer();
    controller.startMeasurement("distance");

    const drawnGeometry = doDraw(olMap, layer, [
        [851873, 6788406],
        [851874, 6788407]
    ]);
    expect(drawnGeometry).toBeDefined();
    expect(drawnGeometry).toBeInstanceOf(LineString);

    const drawnLine = drawnGeometry as LineString;
    expect(drawnLine.getCoordinates()).toEqual([
        [851873, 6788406],
        [851874, 6788407]
    ]);

    controller.stopMeasurement();
});

it("should measure a polygon / area", async () => {
    const { olMap, controller } = setup();
    const layer = controller.getVectorLayer();
    controller.startMeasurement("area");

    const drawnGeometry = doDraw(olMap, layer, [
        [851873, 6788406],
        [851874, 6788407],
        [851875, 6788408]
    ]);
    expect(drawnGeometry).toBeDefined();
    expect(drawnGeometry).toBeInstanceOf(Polygon);

    const drawnPolygon = drawnGeometry as Polygon;
    expect(drawnPolygon.getCoordinates()).toEqual([
        [
            [851873, 6788406],
            [851874, 6788407],
            [851875, 6788408],
            [851873, 6788406]
        ]
    ]);

    controller.stopMeasurement();
});

it("should show active tooltip on draw start and finished tooltip on draw end", async () => {
    const { olMap, controller } = setup();
    controller.startMeasurement("distance");

    const draw = getDrawInteraction(olMap);

    // starts drawing on first set of coordinates
    draw.appendCoordinates([[851873.959638, 6788406.37108]]);

    // Tooltip is created
    const activeTooltip = getTooltipElement(olMap, "measurement-active-tooltip");
    expect(activeTooltip.innerHTML).toMatchInlineSnapshot('"0 m"');

    // Append another coordinate, expect distance to be computed
    draw.appendCoordinates([[851873.959638, 6788406.97408]]);
    expect(activeTooltip.innerHTML).toMatchInlineSnapshot('"0.37 m"');

    // Finish drawing: tooltip should have a different class but same content
    draw.finishDrawing();
    const finishedTooltip = getTooltipElement(olMap, "measurement-finished-tooltip");
    expect(finishedTooltip.innerHTML).toMatchInlineSnapshot('"0.37 m"');

    controller.stopMeasurement();
});

it("uses the configured style for the finished features", async () => {
    const { controller } = setup();
    const layer = controller.getVectorLayer();

    controller.setFinishedFeatureStyle(style1);
    expect(layer.getStyle()).toBe(style1);
});

it("uses the configured style for the active features", async () => {
    const { olMap, controller } = setup();
    controller.setActiveFeatureStyle(style1);
    controller.startMeasurement("distance");

    const draw = getDrawInteraction(olMap);
    const getActiveStyle = () => getDrawStyle(draw);

    expect(getActiveStyle()).toEqual(style1);
    controller.setActiveFeatureStyle(style2);
    expect(getActiveStyle()).toEqual(style2);
});

/**
 * Draws a graphic using the "draw" interaction that has been registered by the controller.
 * Triggers side effects in the controller that ultimately (on completion) put a feature in the vector layer.
 */
function doDraw(
    olMap: OlMap,
    vectorLayer: VectorLayer<VectorSource>,
    coordinates: [number, number][]
) {
    if (getFirstFeature(vectorLayer)) {
        throw new Error("vector layer should be empty at the start of the test");
    }
    if (coordinates.length === 0) {
        throw new Error("must configure at least one coordinate");
    }

    const draw = getDrawInteraction(olMap);

    /*
     * Appends the coordinates to the draw instance (starts drawing on first coordinate).
     */
    for (const coord of coordinates) {
        draw.appendCoordinates([coord]);
    }

    /*
     * Stop drawing and add the sketch feature to the target layer.
     * drawend event is dispatched before inserting the feature.
     */
    draw?.finishDrawing();

    const drawnGeometry = getFirstFeature(vectorLayer);
    if (!drawnGeometry) {
        throw new Error("did not draw a geometry");
    }
    return drawnGeometry;
}

function getDrawInteraction(olMap: OlMap) {
    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find(
        (interaction: Interaction): interaction is Draw => interaction instanceof Draw
    );
    if (!draw) {
        throw new Error("failed to find draw interaction");
    }
    return draw;
}

function getDrawStyle(draw: Draw) {
    const overlayStyle = toStyleFunction(draw.getOverlay().getStyle()!);

    // render a dummy feature (see setActiveFeatureStyle method).
    // "LineString" is checked in the implementation.
    const lineStyle = overlayStyle(
        {
            getGeometry() {
                return {
                    getType() {
                        return "LineString";
                    }
                } as Geometry;
            }
        } as Feature,
        12345
    );

    // normalize to a single style
    if (!Array.isArray(lineStyle) || lineStyle.length !== 1) {
        throw new Error("expected a style array of length 1");
    }
    return lineStyle[0];
}

function getFirstFeature(layer: VectorLayer<VectorSource>) {
    return layer.getSource()?.getFeatures()[0]?.getGeometry();
}

function setup() {
    const olMap = new OlMap();

    // Sometimes needed by Draw interaction (returns null otherwise) :(
    olMap.getPixelFromCoordinate = () => [0, 0];

    const controller = new MeasurementController(olMap, {
        getContinueMessage() {
            return "Click to continue drawing";
        },
        getHelpMessage() {
            return "Click to start drawing";
        }
    });

    return { olMap, controller };
}

function getTooltipElement(olMap: OlMap, className: string): HTMLElement {
    const allOverlays = olMap.getOverlays().getArray();
    const tooltips = allOverlays.filter((ol) => ol.getElement()?.classList.contains(className));
    if (tooltips.length === 0) {
        throw Error("did not find any tooltips");
    }
    if (tooltips.length > 1) {
        throw Error("found multiple tooltips");
    }

    const element = tooltips[0]!.getElement();
    if (!element) {
        throw new Error("tooltip overlay did not have an element");
    }
    return element;
}

function hasActiveDrawInteraction(olMap: OlMap) {
    const interactions = olMap.getInteractions().getArray();
    const draw = interactions?.find((interaction: Interaction) => interaction instanceof Draw);
    return draw?.getActive() || false;
}

const style1 = new Style({
    fill: new Fill({
        color: "rgba(255, 255, 255, 0.2)"
    })
});

const style2 = new Style({
    fill: new Fill({
        color: "rgba(0, 0, 0, 0.2)"
    })
});
