// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Select
} from "@open-pioneer/chakra-integration";
import { FC, useEffect, useState } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { MapModel, useMapModel } from "@open-pioneer/map";
import Feature from "ol/Feature";
import Draw from "ol/interaction/Draw";
import { Vector as VectorSource } from "ol/source";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { LineString, Polygon } from "ol/geom";
import { getArea, getLength } from "ol/sphere";
import Overlay from "ol/Overlay";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import { Coordinate } from "ol/coordinate";
import { Vector as VectorLayer } from "ol/layer";
import { MapBrowserEvent } from "ol";

/**
 * This is for special properties of the Measurement.
 */
export interface MeasurementProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

/**
 * Stores instance of `Draw` interaction. it is global so we can remove it later
 */
let draw: Draw | null = null;

let layer: VectorLayer<VectorSource> | null = null;
let source: VectorSource | undefined = undefined;

/**
 * Currently drawn feature.
 */
let sketch: Feature | null = null;

/**
 * The help tooltip element.
 */
let helpTooltipElement: HTMLElement;

/**
 * Overlay to show the help messages.
 */
let helpTooltip: Overlay;

/**
 * The measure tooltip element.
 */
let measureTooltipElement: HTMLElement | null = null;

/**
 * Overlay to show the measurement.
 */
let measureTooltip: Overlay;

/**
 * Message to show when the user is drawing a polygon.
 */
const continuePolygonMsg: string = "Click to continue drawing the polygon";

/**
 * Message to show when the user is drawing a line.
 */
const continueLineMsg: string = "Click to continue drawing the line";

/**
 * The `Measurement` component can be used in an app to switch between distance and area measurements and to delete all current measurements.
 */
export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();

    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("measurement", props);
    const [selectedMeasurement, setMeasurement] = useState("distance");
    const label = (id: string) => intl.formatMessage({ id: id });

    const state = useMapModel(mapId);
    const map = state.map;

    useEffect(() => {
        setUp(map);
        return () => {
            cleanUp(map);
        };
    }, [map]);

    useEffect(() => {
        if (!map) return;
        addInteraction(selectedMeasurement, map);
        return () => {
            draw && map?.olMap.removeInteraction(draw);
        };
    }, [map, selectedMeasurement]);

    function changeMeasurement(measurement: string) {
        setMeasurement(measurement);
    }

    return (
        <Box {...containerProps}>
            <Box className="measurement-content" padding={2}>
                <FormControl mb={4} alignItems="center">
                    <HStack mb={2}>
                        <FormLabel mb={1}>{label("measurementLabel")}</FormLabel>
                        <Select
                            value={selectedMeasurement}
                            onChange={(e) => changeMeasurement(e.target.value)}
                            className="measurement-select"
                        >
                            <option value={"distance"}>{label("distance")}</option>
                            <option value={"area"}>{label("area")}</option>
                        </Select>
                    </HStack>
                </FormControl>
                <Button
                    padding={2}
                    className="delete-measurements"
                    onClick={() => removeMeasurements(map, selectedMeasurement)}
                    width="100%"
                >
                    {label("deleteMeasurementLabel")}
                </Button>
            </Box>
        </Box>
    );
};

function removeMeasurements(map: MapModel | undefined, measurement: string) {
    draw && map?.olMap.removeInteraction(draw);
    map?.olMap.getOverlays().clear();
    layer?.getSource()?.clear();
    addInteraction(measurement, map);
}

function setUp(map: MapModel | undefined) {
    source = new VectorSource();
    source && createLayer();
    layer && map?.olMap.addLayer(layer);
    map?.olMap.on("pointermove", pointerMoveHandler);
    map?.olMap.getViewport().addEventListener("mouseout", function () {
        helpTooltipElement.classList.add("hidden");
    });
}

function cleanUp(map: MapModel | undefined) {
    layer && map?.olMap.removeLayer(layer);
    map?.olMap.getOverlays().clear();
}

function addInteraction(geometryType: string, map: MapModel | undefined) {
    const type = geometryType == "area" ? "Polygon" : "LineString";

    let changeListener: EventsKey | undefined = undefined;
    const style = getStyle();

    draw = new Draw({
        source: source || undefined,
        type: type,
        style: function (feature) {
            const geometryType = feature?.getGeometry()?.getType();
            if (geometryType === type || geometryType === "Point") {
                return style;
            }
        }
    });
    map?.olMap.addInteraction(draw);

    createMeasureTooltip(map);
    createHelpTooltip(map);

    draw.on("drawstart", function (evt) {
        // set sketch
        sketch = evt.feature;

        let tooltipCoord: Coordinate | null = null;

        changeListener = sketch?.getGeometry()?.on("change", function (evt) {
            const geom = evt.target;
            let output;
            if (geom instanceof Polygon) {
                output = formatArea(geom);
                tooltipCoord = geom.getInteriorPoint().getCoordinates() || null;
            } else if (geom instanceof LineString) {
                output = formatLength(geom);
                tooltipCoord = geom.getLastCoordinate() || null;
            }
            if (measureTooltipElement) {
                measureTooltipElement.innerHTML = output || "";
            }
            measureTooltip && tooltipCoord && measureTooltip.setPosition(tooltipCoord);
        });
    });

    draw.on("drawend", function () {
        if (measureTooltipElement) {
            measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
        }
        measureTooltip && measureTooltip.setOffset([0, -7]);
        // unset sketch
        sketch = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement = null;
        createMeasureTooltip(map);
        changeListener && unByKey(changeListener);
    });
}

const pointerMoveHandler = function (evt: MapBrowserEvent<UIEvent>) {
    if (evt.dragging) {
        return;
    }
    let helpMsg: string = "Click to start drawing";

    if (sketch) {
        const geom = sketch.getGeometry();
        if (geom instanceof Polygon) {
            helpMsg = continuePolygonMsg;
        } else if (geom instanceof LineString) {
            helpMsg = continueLineMsg;
        }
    }

    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);

    helpTooltipElement.classList.remove("hidden");
};

/**
 * Creates a new help tooltip
 */
function createHelpTooltip(map: MapModel | undefined) {
    if (helpTooltipElement) {
        helpTooltipElement.parentNode?.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement("div");
    helpTooltipElement.className = "ol-tooltip hidden";
    helpTooltip = new Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: "center-left"
    });
    map?.olMap.addOverlay(helpTooltip);
}

/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip(map: MapModel | undefined) {
    if (measureTooltipElement) {
        measureTooltipElement?.parentNode?.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement("div");
    measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
    measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: "bottom-center",
        stopEvent: false,
        insertFirst: false
    });
    map?.olMap.addOverlay(measureTooltip);
}
function getStyle() {
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

function formatArea(polygon: Polygon) {
    const area = getArea(polygon);
    let output;
    if (area >= 1000000) {
        output = Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
    } else {
        output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
    }
    return output;
}
function formatLength(line: LineString) {
    const length = getLength(line);
    let output;
    if (length >= 1000) {
        output = Math.round((length / 1000) * 100) / 100 + " " + "km";
    } else {
        output = Math.round(length * 100) / 100 + " " + "m";
    }
    return output;
}

function createLayer() {
    layer = new VectorLayer({
        source: source,
        style: {
            "fill-color": "rgba(255, 255, 255, 0.2)",
            "stroke-color": "#ffcc33",
            "stroke-width": 2,
            "circle-radius": 7,
            "circle-fill-color": "#ffcc33"
        }
    });
}
