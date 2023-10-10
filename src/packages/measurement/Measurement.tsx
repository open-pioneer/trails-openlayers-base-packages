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
 * The `Measurement` component can be used in an app to switch between distance and area measurements and to delete all current measurements.
 */
export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();

    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("measurement", props);
    const [selectedMeasurement, setMeasurement] = useState("distance");
    console.log(mapId);
    const state = useMapModel(mapId);
    const map = state.map;

    const { layer, source } = createLayer();

    /*
     *  Stores instance of `Draw` interaction
     * */
    let draw: Draw | null = null;

    /*
     * Stores currently drawn feature.
     * */
    const sketch: Feature | null = null;

    if (state.kind === "resolved") {
        map?.olMap.addLayer(layer);
        draw = addInteraction(selectedMeasurement, draw, sketch, map, source);
    }

    useEffect(
        () => {
            console.log("mounted");
            state.kind === "resolved" &&
                addInteraction(selectedMeasurement, draw, sketch, map, source);
            return () => {
                console.log("unmounted");
                map?.olMap.removeLayer(layer);
                removeInteraction(map, draw);
            };
        },
        // eslint-disable-next-line
        []
    );

    const label = (id: string) => intl.formatMessage({ id: id });

    function changeMeasurement(measurement: string) {
        setMeasurement(measurement);
        //remove previous and add new draw interaction based on selected measurement
        //map?.olMap.removeLayer(layer);
        draw && state?.map?.olMap.removeInteraction(draw);
        //map?.olMap.addLayer(layer);
        draw = addInteraction(measurement, draw, sketch, map, source);
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
                    onClick={() => removeInteraction(map, draw)}
                    width="100%"
                >
                    {label("deleteMeasurementLabel")}
                </Button>
            </Box>
        </Box>
    );
};

function removeInteraction(map: MapModel | undefined, draw: Draw | null) {
    console.log("Clear drawn measurements");
    draw && map?.olMap.removeInteraction(draw);
}

function addInteraction(
    geometryType: string,
    draw: Draw | null,
    sketch: Feature | null,
    map: MapModel | undefined,
    source: VectorSource
) {
    const type = geometryType == "area" ? "Polygon" : "LineString";

    let listener: EventsKey | undefined = undefined;
    let measureTooltipElement: HTMLElement | null = null;
    let measureTooltip: Overlay | null = null;
    const style = getStyle();

    draw = new Draw({
        source: source,
        type: type,
        style: function (feature) {
            const geometryType = feature?.getGeometry()?.getType();
            if (geometryType === type || geometryType === "Point") {
                return style;
            }
        }
    });

    map?.olMap.addInteraction(draw);
    const { mte, mt } = createMeasureTooltip(measureTooltipElement, measureTooltip, map);
    measureTooltipElement = mte;
    measureTooltip = mt;
    draw.on("drawstart", function (evt) {
        // set sketch
        sketch = evt.feature;

        let tooltipCoord: Coordinate | null = null;

        listener = sketch?.getGeometry()?.on("change", function (evt) {
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
        const { mte, mt } = createMeasureTooltip(measureTooltipElement, measureTooltip, map);
        measureTooltipElement = mte;
        measureTooltip = mt;
        listener && unByKey(listener);
    });

    return draw;
}
function createMeasureTooltip(
    measureTooltipElement: HTMLElement | null,
    measureTooltip: Overlay | null,
    map: MapModel | undefined
) {
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
    return { mte: measureTooltipElement, mt: measureTooltip };
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
    if (area > 10000) {
        output = Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
    } else {
        output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
    }
    return output;
}
function formatLength(line: LineString) {
    const length = getLength(line);
    let output;
    if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + " " + "km";
    } else {
        output = Math.round(length * 100) / 100 + " " + "m";
    }
    return output;
}

function createLayer() {
    const source = new VectorSource();
    const vector = new VectorLayer({
        source: source,
        style: {
            "fill-color": "rgba(255, 255, 255, 0.2)",
            "stroke-color": "#ffcc33",
            "stroke-width": 2,
            "circle-radius": 7,
            "circle-fill-color": "#ffcc33"
        }
    });
    return { layer: vector, source: source };
}
