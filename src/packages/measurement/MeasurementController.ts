// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import { PackageIntl } from "@open-pioneer/runtime";
import Feature from "ol/Feature";
import OlMap from "ol/Map";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import { LineString, Polygon } from "ol/geom";
import Draw from "ol/interaction/Draw";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { getArea, getLength } from "ol/sphere";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

export type MeasurementType = "area" | "distance";

export class MeasurementController {
    private intl: PackageIntl;
    private olMap: OlMap;

    /**
     * The layer rendering the measurement "features".
     */
    private layer: VectorLayer<VectorSource>;

    /**
     * Source of {@link layer}.
     */
    private source: VectorSource;

    /**
     * Stores the current `Draw` interaction.
     */
    private draw: Draw | undefined = undefined;

    /**
     * Currently drawn feature.
     */
    private sketch: Feature | undefined = undefined;

    /**
     * The help tooltip element.
     */
    private helpTooltip: Tooltip;

    /**
     * The current measurement tooltip (if any).
     */
    private measureTooltip: Tooltip | undefined;

    /**
     * Overlays/Tooltip containing the tooltip for finished drawings.
     */
    private overlayTooltips: Tooltip[] = [];

    /**
     * Keeps track of registered event handlers.
     */
    private resources: Resource[] = [];

    constructor(olMap: OlMap, intl: PackageIntl) {
        this.olMap = olMap;
        this.intl = intl;

        const source = (this.source = new VectorSource());
        this.layer = new VectorLayer({
            source,
            style: {
                "fill-color": "rgba(255, 255, 255, 0.2)",
                "stroke-color": "#ffcc33",
                "stroke-width": 2,
                "circle-radius": 7,
                "circle-fill-color": "#ffcc33"
            }
        });
        olMap.addLayer(this.layer);

        const pointerMoveKey = olMap.on("pointermove", this.handlePointerMove.bind(this));
        this.resources.push({
            destroy() {
                unByKey(pointerMoveKey);
            }
        });

        const mouseOutHandler = () => {
            this.helpTooltip.element.classList.add("hidden");
        };
        olMap.getViewport().addEventListener("mouseout", mouseOutHandler);
        this.resources.push({
            destroy() {
                olMap.getViewport().removeEventListener("mouseout", mouseOutHandler);
            }
        });

        this.helpTooltip = this.createHelpTooltip();
    }

    destroy() {
        this.stopMeasurement();

        // Cleanup registered event handlers etc.
        for (const resource of this.resources) {
            resource.destroy();
        }
        this.resources = [];

        // Cleanup tooltips
        this.helpTooltip.destroy();
        this.measureTooltip?.destroy();
        for (const tooltip of this.overlayTooltips) {
            tooltip.destroy();
        }
        this.overlayTooltips = [];

        // Cleanup layer
        this.olMap.removeLayer(this.layer);
        this.layer.dispose();
        this.source.dispose();
    }

    clearMeasurements() {
        this.source.clear();
        for (const tooltip of this.overlayTooltips) {
            tooltip.destroy();
        }
        this.overlayTooltips = [];
    }

    startMeasurement(type: MeasurementType) {
        if (this.draw) {
            throw new Error("Internal error: another measurement interaction is still active.");
        }

        const geometryType = type === "area" ? "Polygon" : "LineString";
        const style = getStyle();
        const draw = (this.draw = new Draw({
            source: this.source,
            type: geometryType,
            style: function (feature) {
                const featureGeometryType = feature?.getGeometry()?.getType();
                if (featureGeometryType === geometryType || featureGeometryType === "Point") {
                    return style;
                }
            }
        }));
        this.olMap.addInteraction(draw);

        let measureTooltip: Tooltip | undefined;

        let changeListenerKey: EventsKey | undefined = undefined;
        draw.on("drawstart", (evt) => {
            measureTooltip = this.measureTooltip = this.createMeasureTooltip();

            // set sketch
            const sketch = (this.sketch = evt.feature);
            if (!sketch) {
                return;
            }

            let tooltipCoord: Coordinate | undefined;
            changeListenerKey = sketch.getGeometry()?.on("change", (evt) => {
                const geom = evt.target;
                let output = "";
                if (geom instanceof Polygon) {
                    output = formatArea(geom);
                    tooltipCoord = geom.getInteriorPoint().getCoordinates() || null;
                } else if (geom instanceof LineString) {
                    output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate() || null;
                }

                if (measureTooltip) {
                    measureTooltip.element.innerHTML = output;
                    if (tooltipCoord) {
                        measureTooltip?.overlay.setPosition(tooltipCoord);
                    }
                }
            });
        });

        draw.on("drawend", () => {
            if (measureTooltip) {
                // Make the tooltip (which was previously following the mouse)
                // static instead, next to the feature (last known overlay coordinate).
                const classes = measureTooltip.element.classList;
                classes.remove("active-tooltip");
                classes.add("finished-tooltip");
                measureTooltip.overlay.setOffset([0, -7]);

                this.overlayTooltips.push(measureTooltip);
                this.measureTooltip = measureTooltip = undefined;
            }

            // unset sketch
            this.sketch = undefined;
            if (changeListenerKey) {
                unByKey(changeListenerKey);
            }
        });
    }

    stopMeasurement() {
        if (this.draw) {
            this.olMap.removeInteraction(this.draw);
            this.draw.abortDrawing();
            this.draw.dispose();
            this.draw = undefined;
        }

        this.sketch = undefined;
        this.measureTooltip?.destroy();
        this.measureTooltip = undefined;
    }

    private createMeasureTooltip(): Tooltip {
        const element = document.createElement("div");
        element.className = "measurement-tooltip active-tooltip";

        const overlay = new Overlay({
            element: element,
            offset: [0, -15],
            positioning: "bottom-center",
            stopEvent: false,
            insertFirst: false
        });

        const olMap = this.olMap;
        olMap.addOverlay(overlay);
        return {
            overlay,
            element,
            destroy() {
                olMap.removeOverlay(overlay);
            }
        };
    }

    private createHelpTooltip(): Tooltip {
        const element = document.createElement("div");
        element.className = "measurement-tooltip hidden";

        const overlay = new Overlay({
            element: element,
            offset: [15, 0],
            positioning: "center-left"
        });

        const olMap = this.olMap;
        olMap.addOverlay(overlay);
        return {
            overlay,
            element,
            destroy() {
                olMap.removeOverlay(overlay);
            }
        };
    }

    private handlePointerMove(evt: MapBrowserEvent<UIEvent>) {
        if (evt.dragging) {
            return;
        }

        const tooltip = this.helpTooltip;
        const helpMessage = getHelpMessage(this.intl, this.sketch);
        tooltip.element.textContent = helpMessage;
        tooltip.overlay.setPosition(evt.coordinate);
        tooltip.element.classList.remove("hidden");
    }
}

/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

function getHelpMessage(intl: PackageIntl, sketch: Feature | undefined) {
    if (sketch) {
        const geom = sketch.getGeometry();
        if (geom instanceof Polygon || geom instanceof LineString) {
            return intl.formatMessage({
                id: "tooltips.continue"
            });
        }
    }
    return intl.formatMessage({
        id: "tooltips.help"
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
