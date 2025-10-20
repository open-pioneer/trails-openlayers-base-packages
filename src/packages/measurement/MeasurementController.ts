// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { destroyResource, Resource } from "@open-pioneer/core";
import { LayerFactory, MapModel, SimpleLayer } from "@open-pioneer/map";
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
import { Projection } from "ol/proj";
import { Vector as VectorSource } from "ol/source";
import { getArea, getLength } from "ol/sphere";
import { StyleFunction, StyleLike, toFunction as toStyleFunction } from "ol/style/Style";
import type { MeasurementsChangeEvent, MeasurementGeometry, MeasurementProps } from "./Measurement";

type MeasurementsChangeHandler = NonNullable<MeasurementProps["onMeasurementsChange"]>;

export type MeasurementType = "area" | "distance";

export interface Messages {
    getContinueMessage(): string;
    getHelpMessage(): string;
    formatNumber(value: number): string;
}

export class MeasurementController {
    readonly map: MapModel;
    readonly olMap: OlMap;
    readonly messages: Messages;

    private activeFeatureStyle: StyleFunction | undefined;
    /**
     * The layer rendering the measurement "features".
     */
    private layer: SimpleLayer;

    /**
     * Source of {@link layer}.
     */
    private source: VectorSource;

    /**
     * Stores the current `Draw` interaction.
     */
    private draw: Draw | undefined = undefined;

    /**
     * The active measurement manipulated by the `draw` interaction.
     */
    private activeMeasurement: MeasurementInstance | undefined;

    /**
     * Map that is used to track all predefined measurements currently added to the source.
     * It associates the measurement geometry (key) with the corresponding measurement instance.
     *
     * The measurement instances here must also be contained in `finishedMeasurements`.
     */
    private predefinedMeasurements = new Map<MeasurementGeometry, MeasurementInstance>();

    /**
     * Measurement instances that were finished.
     */
    private finishedMeasurements = new Set<MeasurementInstance>();

    /**
     * The help tooltip element.
     */
    private helpTooltip: Tooltip;

    /**
     * Keeps track of registered event handlers.
     */
    private resources: Resource[] = [];

    /**
     * Called when a measurement is added to or removed from the source.
     */
    private measurementChangedHandler: MeasurementsChangeHandler | undefined;

    constructor(map: MapModel, layerFactory: LayerFactory, messages: Messages) {
        this.map = map;
        this.olMap = map.olMap;
        this.messages = messages;
        const source = (this.source = new VectorSource());
        this.layer = layerFactory.create({
            type: SimpleLayer,
            internal: true,
            title: "measurement-layer",
            olLayer: new VectorLayer<VectorSource, Feature>({
                source: source
            })
        });
        map.layers.addLayer(this.layer, { at: "topmost" });

        // "pointermove" is documented but produces a typescript error.
        // See https://openlayers.org/en/latest/apidoc/module-ol_MapBrowserEvent-MapBrowserEvent.html#event:pointermove
        const pointerMoveKey: EventsKey = this.olMap.on(
            // @ts-expect-error pointermove not declared
            "pointermove",
            this.handlePointerMove.bind(this)
        );
        this.resources.push({
            destroy() {
                unByKey(pointerMoveKey);
            }
        });

        this.helpTooltip = createHelpTooltip(this.olMap);
    }

    destroy() {
        this.stopMeasurement();

        // Cleanup registered event handlers etc.
        for (const resource of this.resources) {
            resource.destroy();
        }
        this.resources = [];

        // Cleanup measurements and tooltips.
        this.activeMeasurement = destroyResource(this.activeMeasurement);
        for (const measurement of this.finishedMeasurements) {
            measurement.destroy();
        }
        this.finishedMeasurements.clear();
        this.helpTooltip.destroy();

        // Cleanup layer
        this.map.layers.removeLayer(this.layer.id);

        this.measurementChangedHandler = undefined;
        this.predefinedMeasurements.clear();
    }

    /** Returns the vector layer used for finished features. */
    getOlVectorLayer() {
        return this.layer.olLayer as VectorLayer;
    }

    /** Updates the style used for finished features. */
    setFinishedFeatureStyle(style: StyleLike) {
        this.getOlVectorLayer().setStyle(style);
    }

    setMeasurementSourceChangedHandler(handler: MeasurementsChangeHandler | undefined) {
        this.measurementChangedHandler = handler;
    }

    setPredefinedMeasurements(geometries: MeasurementGeometry[]) {
        this.updatePredefinedMeasurements(geometries);
    }

    /** Updates the style used for active measurements. */
    setActiveFeatureStyle(style: StyleLike) {
        const styleFunction = toStyleFunction(style);
        this.activeFeatureStyle = (feature, ...args) => {
            const ft = feature?.getGeometry()?.getType();
            if (ft === "Polygon" || ft === "LineString" || ft === "Point") {
                return styleFunction(feature, ...args);
            }
        };
        // Update style on current draw instance (if any)
        this.draw?.getOverlay().setStyle(this.activeFeatureStyle);
    }

    /** Removes all finished measurements. */
    clearMeasurements() {
        const currentFeatures = this.source.getFeatures(); //returns snapshot copy of the features on the source
        this.source.clear();
        currentFeatures.forEach((feature) => {
            //raise remove-measurement event for each measurement after the source was cleared
            this.raiseMeasurementsChangeEvent("remove-measurement", feature);
        });
        this.predefinedMeasurements.clear();
        for (const measurement of this.finishedMeasurements) {
            measurement.destroy();
        }
        this.finishedMeasurements.clear();
    }

    /** Starts measuring using the provided type. */
    startMeasurement(type: MeasurementType) {
        if (this.draw) {
            throw new Error("Internal error: another measurement interaction is still active.");
        }

        const geometryType = type === "area" ? "Polygon" : "LineString";
        const draw = (this.draw = new Draw({
            source: this.source,
            type: geometryType,
            style: this.activeFeatureStyle
        }));
        this.olMap.addInteraction(draw);

        // update tooltip if user changed drawing mode (and did not move the mouse yet)
        // currently this does not work when the tool is initially activated as the tooltip has no position yet
        this.updateTooltip(undefined);

        let measurement: MeasurementInstance | undefined;
        let changeListenerKey: EventsKey | undefined = undefined;
        draw.on("drawstart", (evt) => {
            // set sketch
            const sketch = evt.feature;
            if (!sketch) {
                return;
            }

            measurement = this.activeMeasurement = new MeasurementInstance("active", sketch, this);
            changeListenerKey = sketch.getGeometry()?.on("change", () => {
                measurement?.updateTooltipContent();
                measurement?.updateTooltipPosition();
            });

            // update tooltip message if user started drawing but did not yet move the mouse
            this.updateTooltip(undefined);
        });

        draw.on("drawend", () => {
            if (measurement && measurement === this.activeMeasurement) {
                const newMeasurement = measurement;
                newMeasurement.updateState("finished");
                this.finishedMeasurements.add(newMeasurement);
                this.raiseMeasurementsChangeEvent("add-measurement", newMeasurement.feature);
                this.activeMeasurement = measurement = undefined;
            }

            measurement = undefined;
            if (changeListenerKey) {
                unByKey(changeListenerKey);
            }

            // update tooltip if user finished drawing but did not yet move the mouse
            this.updateTooltip(undefined);
        });

        draw.on("drawabort", () => {
            if (measurement) {
                measurement.destroy();
                if (measurement === this.activeMeasurement) {
                    this.activeMeasurement = undefined;
                }
                measurement = undefined;
            }

            if (changeListenerKey) {
                unByKey(changeListenerKey);
            }
        });
    }

    /** Stops the current measuring started by `startMeasurement`. */
    stopMeasurement() {
        if (this.draw) {
            this.olMap.removeInteraction(this.draw);
            this.draw.abortDrawing();
            this.draw.dispose();
            this.draw = undefined;
        }

        this.activeMeasurement = destroyResource(this.activeMeasurement);
    }

    private handlePointerMove(evt: MapBrowserEvent<PointerEvent>) {
        if (evt.dragging) {
            return;
        }
        this.updateTooltip(evt.coordinate);
    }

    private updateTooltip(coordinate: number[] | undefined) {
        const tooltip = this.helpTooltip;
        const helpMessage = getHelpMessage(this.messages, this.activeMeasurement);
        tooltip.setText(helpMessage);
        if (coordinate) {
            tooltip.overlay.setPosition(coordinate);
        }
    }

    private updatePredefinedMeasurements(geometries: MeasurementGeometry[]) {
        const addedMeasurements = geometries.filter(
            (geom) => !this.predefinedMeasurements.has(geom)
        );
        const removedMeasurements: MeasurementGeometry[] = [];
        for (const geom of this.predefinedMeasurements.keys()) {
            if (!geometries.includes(geom)) {
                removedMeasurements.push(geom);
            }
        }

        addedMeasurements.forEach((geom) => {
            const measurementFeature = new Feature(geom);
            this.source.addFeature(measurementFeature);

            const measurement = new MeasurementInstance("finished", measurementFeature, this);
            this.finishedMeasurements.add(measurement);
            this.predefinedMeasurements.set(geom, measurement);
            this.raiseMeasurementsChangeEvent("add-measurement", measurementFeature);
        });

        removedMeasurements.forEach((geom) => {
            const measurement = this.predefinedMeasurements.get(geom);
            if (measurement) {
                //remove measurement feature from source and destroy associated tooltip
                this.source.removeFeature(measurement.feature);
                this.finishedMeasurements.delete(measurement);
                measurement.destroy();
                this.raiseMeasurementsChangeEvent("remove-measurement", measurement.feature);
            }
            this.predefinedMeasurements.delete(geom);
        });
    }

    private raiseMeasurementsChangeEvent(
        kind: MeasurementsChangeEvent["kind"],
        measurementFeature: Feature
    ) {
        const measurementGeom = measurementFeature.getGeometry();
        if (this.measurementChangedHandler && measurementGeom) {
            this.measurementChangedHandler({
                kind: kind,
                geometry:
                    measurementGeom instanceof Polygon
                        ? (measurementGeom as Polygon)
                        : (measurementGeom as LineString)
            });
        }
    }
}

// Encapsulates the display state of a measurement.
//
// More ideas for further improvements:
// - Resolve duplicate source of truths (feature source and map of measurements).
// - Add and remove the feature here as well (instead of in the controller).
// - Perhaps use reactivity API and watch for state consistency.
//   The current implementations relies on the update*() functions being called at the correct time.
class MeasurementInstance {
    readonly controller: MeasurementController;
    readonly feature: Feature;

    private _state: "active" | "finished";
    private readonly tooltip: ReturnType<typeof createMeasureTooltip>;

    constructor(state: "active" | "finished", feature: Feature, controller: MeasurementController) {
        this.controller = controller;
        this._state = state;
        this.feature = feature;
        this.tooltip = createMeasureTooltip(this.olMap);
        this.updateTooltipContent();
        this.updateTooltipPosition();
        this.tooltip.setActive(state === "active");
    }

    destroy() {
        this.tooltip.destroy();
    }

    get state(): "active" | "finished" {
        return this._state;
    }

    updateState(state: "active" | "finished") {
        if (this._state === state) {
            return;
        }

        this._state = state;
        this.tooltip.setActive(state === "active");
    }

    // Updates the tooltip content based on the current state and the feature's geometry.
    updateTooltipContent() {
        const geometry = this.feature.getGeometry();
        if (!geometry) {
            return;
        }

        const projection = this.olMap.getView().getProjection();
        let outputHtml;
        if (geometry instanceof Polygon) {
            outputHtml = formatArea(geometry, projection, this.messages);
        } else if (geometry instanceof LineString) {
            outputHtml = formatLength(geometry, projection, this.messages);
        }
        if (outputHtml) {
            this.tooltip.setHtml(outputHtml);
        }
    }

    // Updates the tooltip's position.
    updateTooltipPosition() {
        const geometry = this.feature.getGeometry();
        if (!geometry) {
            return;
        }

        let tooltipCoord: Coordinate;
        if (geometry instanceof Polygon) {
            tooltipCoord = geometry.getInteriorPoint().getCoordinates() || null;
        } else if (geometry instanceof LineString) {
            tooltipCoord = geometry.getLastCoordinate() || null;
        } else {
            return;
        }
        this.tooltip.overlay.setPosition(tooltipCoord);
    }

    private get olMap(): OlMap {
        return this.controller.olMap;
    }

    private get messages(): Messages {
        return this.controller.messages;
    }
}

const DEFAULT_MEASUREMENT_OFFSET = [0, -15];
const FINISHED_MEASUREMENT_OFFSET = [0, -7];

/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;

    setText(value: string): void;
    setHtml(value: string): void;
}

function createHelpTooltip(olMap: OlMap): Tooltip {
    const element = document.createElement("div");
    element.className = "measurement-tooltip printing-hide";
    element.role = "tooltip";

    const content = document.createElement("span");
    element.appendChild(content);

    const overlay = new Overlay({
        element: element,
        offset: [15, 0],
        positioning: "center-left"
    });

    olMap.addOverlay(overlay);
    return {
        overlay,
        element,
        destroy() {
            olMap.removeOverlay(overlay);
        },
        setText(value) {
            content.textContent = value;
        },
        setHtml(value) {
            content.innerHTML = value;
        }
    };
}

function createMeasureTooltip(olMap: OlMap): Tooltip & { setActive(active: boolean): void } {
    const element = document.createElement("div");
    element.role = "tooltip";
    element.className = "measurement-tooltip measurement-active-tooltip printing-hide";

    const content = document.createElement("span");
    element.appendChild(content);

    const overlay = new Overlay({
        element: element,
        offset: DEFAULT_MEASUREMENT_OFFSET,
        positioning: "bottom-center",
        stopEvent: false,
        insertFirst: false
    });

    olMap.addOverlay(overlay);
    return {
        overlay,
        element,
        destroy() {
            olMap.removeOverlay(overlay);
        },
        setActive(active) {
            if (active) {
                element.className = "measurement-tooltip measurement-active-tooltip printing-hide";
                overlay.setOffset(DEFAULT_MEASUREMENT_OFFSET);
            } else {
                element.className = "measurement-tooltip measurement-finished-tooltip";
                overlay.setOffset(FINISHED_MEASUREMENT_OFFSET);
            }
        },
        setText(value) {
            content.textContent = value;
        },
        setHtml(value) {
            content.innerHTML = value;
        }
    };
}

function getHelpMessage(messages: Messages, activeMeasurement: MeasurementInstance | undefined) {
    if (activeMeasurement) {
        const geom = activeMeasurement.feature.getGeometry();
        if (geom instanceof Polygon || geom instanceof LineString) {
            return messages.getContinueMessage();
        }
    }
    return messages.getHelpMessage();
}

function formatArea(polygon: Polygon, projection: Projection, messages: Messages) {
    const area = getArea(polygon, { projection });
    let output;
    if (area >= 1000000) {
        output = `${messages.formatNumber(area / 1000000)} km<sup>2</sup>`;
    } else {
        output = `${messages.formatNumber(area)} m<sup>2</sup>`;
    }
    return output;
}

function formatLength(line: LineString, projection: Projection, messages: Messages) {
    const length = getLength(line, { projection });
    let output;
    if (length >= 1000) {
        output = `${messages.formatNumber(length / 1000)} km`;
    } else {
        output = `${messages.formatNumber(length)} m`;
    }
    return output;
}
