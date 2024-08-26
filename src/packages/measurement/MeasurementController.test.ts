// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";
import { MeasurementsChangeEvent } from "./Measurement";
import { MeasurementController } from "./MeasurementController";
import OlMap from "ol/Map";
import { Interaction } from "ol/interaction";
import Draw from "ol/interaction/Draw";
import LineString from "ol/geom/LineString";
import VectorLayer from "ol/layer/Vector";
import { Fill, Style } from "ol/style";
import { StyleLike, toFunction as toStyleFunction } from "ol/style/Style";
import { Geometry, Polygon } from "ol/geom";
import { Feature, View } from "ol";

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

it("should respect the map's current projection (EPSG:3857)", async () => {
    const { olMap, controller } = setup();
    olMap.setView(
        new View({
            projection: "EPSG:3857"
        })
    );

    const layer = controller.getVectorLayer();
    controller.startMeasurement("distance");

    // This is roughly 100 meters according to scale bar and measurement widget in browser
    // Tests seem to return a slightly different result but this doesn't appear worth investigating right now.
    doDraw(olMap, layer, [
        [405406.30970983295, 5757830.632703076],
        [405504.7015101256, 5757830.632703076]
    ]);

    const finishedTooltip = getTooltipElement(olMap, "measurement-finished-tooltip");
    expect(finishedTooltip.innerHTML).toMatchInlineSnapshot(`"<span>68.45 m</span>"`);

    controller.stopMeasurement();
});

it("should respect the map's current projection (EPSG:4326)", async () => {
    const { olMap, controller } = setup();
    olMap.setView(
        new View({
            projection: "EPSG:4326"
        })
    );

    const layer = controller.getVectorLayer();
    controller.startMeasurement("distance");

    doDraw(olMap, layer, [
        [7.6259541581576, 51.958121972868796],
        [7.627415371234616, 51.958121972868796]
    ]);

    const finishedTooltip = getTooltipElement(olMap, "measurement-finished-tooltip");
    expect(finishedTooltip.innerHTML).toMatchInlineSnapshot(`"<span>100.13 m</span>"`);

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
    expect(activeTooltip.innerHTML).toMatchInlineSnapshot(`"<span>0 m</span>"`);

    // Append another coordinate, expect distance to be computed
    draw.appendCoordinates([[851873.959638, 6788406.97408]]);
    expect(activeTooltip.innerHTML).toMatchInlineSnapshot(`"<span>0.37 m</span>"`);

    // Finish drawing: tooltip should have a different class but same content
    draw.finishDrawing();
    const finishedTooltip = getTooltipElement(olMap, "measurement-finished-tooltip");
    expect(finishedTooltip.innerHTML).toMatchInlineSnapshot(`"<span>0.37 m</span>"`);

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

it("should add predefined measurement to vector source", async () => {
    const { controller } = setup();
    const predefinedMeasurementGeom = new LineString([
        [398657.97, 5755696.26],
        [402570.98, 5757547.78]
    ]);
    controller.setPredefinedMeasurements([predefinedMeasurementGeom]);

    const layer = controller.getVectorLayer();
    const source = layer.getSource();
    //source stores features => check the feature's geometry
    const measurementFromSource = source
        ?.getFeatures()
        .find((feature) => feature.getGeometry() === predefinedMeasurementGeom);

    expect(measurementFromSource?.getGeometry()).toEqual(predefinedMeasurementGeom);
    expect(source?.getFeatures().length).toEqual(1);
});

it("should not add a predefined measurement to vector source a second time", async () => {
    const { controller } = setup();
    const predefinedMeasurementGeomA = new LineString([
        [398657.97, 5755696.26],
        [402570.98, 5757547.78]
    ]);
    const predefinedMeasurementGeomB = new LineString([
        [398999.97, 5755696.26],
        [402999.98, 5757547.78]
    ]);
    controller.setPredefinedMeasurements([predefinedMeasurementGeomA]);
    controller.setPredefinedMeasurements([predefinedMeasurementGeomA, predefinedMeasurementGeomB]);

    const layer = controller.getVectorLayer();
    const source = layer.getSource();
    //source stores features => check the feature's geometry
    const matches = source
        ?.getFeatures()
        .filter((feature) => feature.getGeometry() === predefinedMeasurementGeomA);

    expect(matches?.length).toEqual(1);
    expect(source?.getFeatures().length).toEqual(2);
});

it("should remove previous predefine measurement from vector source", async () => {
    const { controller } = setup();
    const predefinedMeasurementGeomA = new LineString([
        [398657.97, 5755696.26],
        [402570.98, 5757547.78]
    ]);
    const predefinedMeasurementGeomB = new LineString([
        [398999.97, 5755696.26],
        [402999.98, 5757547.78]
    ]);
    controller.setPredefinedMeasurements([predefinedMeasurementGeomA, predefinedMeasurementGeomB]);
    controller.setPredefinedMeasurements([predefinedMeasurementGeomA]); //predefinedMeasurementGeomB should not be on vector source anymore

    const layer = controller.getVectorLayer();
    const source = layer.getSource();
    //source stores features => check the feature's geometry
    const index = source
        ?.getFeatures()
        .findIndex((feature) => feature.getGeometry() === predefinedMeasurementGeomB); //-1 if not found

    expect(index).toEqual(-1);
    expect(source?.getFeatures().length).toEqual(1);
});

it("should raise add/remove events if predefined measurements are added/deleted", async () => {
    const { controller } = setup();
    const predefinedMeasurementGeom = new LineString([
        [398657.97, 5755696.26],
        [402570.98, 5757547.78]
    ]);

    let addCounter = 0;
    let removeCounter = 0;
    const handlerFn = (e: MeasurementsChangeEvent) => {
        expect(e.geometry).toEqual(predefinedMeasurementGeom);
        if (e.kind === "add-measurement") {
            addCounter++;
        } else if (e.kind === "remove-measurement") {
            removeCounter++;
        }
    };

    controller.setMeasurementSourceChangedHandler(handlerFn);
    controller.setPredefinedMeasurements([predefinedMeasurementGeom]);
    controller.setPredefinedMeasurements([]);

    expect(addCounter).toEqual(1);
    expect(removeCounter).toEqual(1);
});

it("should raise add/remove events if user adds/clears measurements", async () => {
    const { olMap, controller } = setup();
    const layer = controller.getVectorLayer();
    controller.startMeasurement("distance");

    let addCounter = 0;
    let removeCounter = 0;
    const handlerFn = (e: MeasurementsChangeEvent) => {
        if (e.kind === "add-measurement") {
            addCounter++;
        } else if (e.kind === "remove-measurement") {
            removeCounter++;
        }
    };
    controller.setMeasurementSourceChangedHandler(handlerFn);

    doDraw(olMap, layer, [
        [851873, 6788406],
        [851874, 6788407]
    ]);
    controller.clearMeasurements();

    expect(addCounter).toEqual(1);
    expect(removeCounter).toEqual(1);
});

it("should add name property to measurement layer", async () => {
    const { controller } = setup();
    const layer = controller.getVectorLayer();

    expect(layer.getProperties()["name"]).toBe("measurement-layer");
});

/**
 * Draws a graphic using the "draw" interaction that has been registered by the controller.
 * Triggers side effects in the controller that ultimately (on completion) put a feature in the vector layer.
 */
function doDraw(olMap: OlMap, vectorLayer: VectorLayer<Feature>, coordinates: [number, number][]) {
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
    // Currently always a style like (not flat style like).
    const style = draw.getOverlay().getStyle()! as StyleLike;
    const overlayStyle = toStyleFunction(style);

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

function getFirstFeature(layer: VectorLayer<Feature>) {
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
        },
        formatNumber(value) {
            return String(Math.round(value * 100) / 100);
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
