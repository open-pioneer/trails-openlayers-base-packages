// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core/resources";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import { mouseActionButton } from "ol/events/condition";
import Geometry from "ol/geom/Geometry";
import { SelectionMethods } from "./Selection";
import { DragBox } from "ol/interaction";
import Draw, { createBox } from "ol/interaction/Draw";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Feature } from "ol";

interface SelectionBox extends Resource {
    dragBox: DragBox;
}

// TODO: BOX_DRAW is just implemented to compare it with "right click" dragging.
interface SelectionDrawBox extends Resource {
    drawBox: Draw;
}

/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

const ACTIVE_CLASS = "spatial-selection-active";
const INACTIVE_CLASS = "spatial-selection-inactive";

export class DragController {
    private tooltip: Tooltip;
    private dragBox?: SelectionBox;
    // TODO: BOX_DRAW is just implemented to compare it with "right click" dragging.
    private drawLayer?: VectorLayer<VectorSource>;
    private drawBox?: SelectionDrawBox;
    private olMap: OlMap;
    private isActive: boolean = true;
    private tooltipMessage: string;
    private tooltipDisabledMessage: string;

    constructor(
        olMap: OlMap,
        selectMethode: string,
        tooltipMessage: string,
        tooltipDisabledMessage: string,
        onExtentSelected: (geometry: Geometry) => void
    ) {
        /**
         * Notice for Projectdeveloper
         * Add cases for more Selectionmethods
         */
        switch (selectMethode) {
            case SelectionMethods.extent:
                this.dragBox = this.createDragBox(olMap, onExtentSelected);
                break;
            case "BOX_DRAW":
                // TODO: BOX_DRAW is just implemented to compare it with "right click" dragging.
                //       If it stays, it must be refactored in the wright way
                this.drawLayer = new VectorLayer({ source: new VectorSource({ wrapX: false }) });
                this.drawBox = this.createDrawBoxInteraction(olMap, onExtentSelected);
                break;
            default:
                this.dragBox = this.createDragBox(olMap, onExtentSelected);
                break;
        }

        this.tooltip = this.createHelpTooltip(olMap, tooltipMessage);
        this.olMap = olMap;
        this.tooltipMessage = tooltipMessage;
        this.tooltipDisabledMessage = tooltipDisabledMessage;
    }

    /**
     * Method for destroying the controller when it is no longer needed
     */
    destroy() {
        this.tooltip.destroy();
        if (this.dragBox) this.dragBox.destroy();
        if (this.drawBox) this.drawBox.destroy();
    }

    setActive(isActive: boolean) {
        if (this.isActive === isActive || (!this.dragBox && !this.drawBox)) return;
        const viewPort = this.olMap.getViewport();
        if (this.dragBox) {
            if (isActive) {
                this.olMap.addInteraction(this.dragBox.dragBox);
                this.tooltip.element.textContent = this.tooltipMessage;
                viewPort.classList.remove(INACTIVE_CLASS);
                viewPort.classList.add(ACTIVE_CLASS);
                this.isActive = true;
            } else {
                this.olMap.removeInteraction(this.dragBox.dragBox);
                this.tooltip.element.textContent = this.tooltipDisabledMessage;
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.add(INACTIVE_CLASS);
                this.isActive = false;
            }
        } else if (this.drawBox) {
            // TODO: BOX_DRAW-Logik is just implemented to compare it with "right click" dragging. Could be removed
            if (isActive) {
                this.olMap.addInteraction(this.drawBox.drawBox);
                this.tooltip.element.textContent = this.tooltipMessage;
                viewPort.classList.remove(INACTIVE_CLASS);
                viewPort.classList.add(ACTIVE_CLASS);
                this.isActive = true;
            } else {
                this.drawBox?.drawBox.abortDrawing();
                this.olMap.removeInteraction(this.drawBox.drawBox);
                this.tooltip.element.textContent = this.tooltipDisabledMessage;
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.add(INACTIVE_CLASS);
                this.isActive = false;
            }
        }
    }

    /**
     * // TODO: BOX_DRAW-Logik is just implemented to compare it with "right click" dragging. Could be removed
     * @param olMap
     * @param onExtentSelected
     * @private
     */
    private createDrawBoxInteraction(olMap: OlMap, onExtentSelected: (geometry: Geometry) => void) {
        const source = this.drawLayer?.getSource() ?? undefined;
        const draw = new Draw({
            source: source,
            type: "Circle",
            geometryFunction: createBox(),
            // TODO: make it configurable / use theme
            style: this.getDefaultBoxFeatureStyle()
        });
        olMap.addInteraction(draw);
        let drawnBoxFeature: Feature | undefined;

        draw.on("drawstart", (evt) => {
            drawnBoxFeature = evt.feature;
            if (!drawnBoxFeature) {
                return;
            }
        });

        draw.on("drawend", () => {
            drawnBoxFeature?.getGeometry() && onExtentSelected(drawnBoxFeature.getGeometry()!);
            drawnBoxFeature = undefined;
        });

        draw.on("drawabort", () => {
            drawnBoxFeature = undefined;
        });

        const viewPort = olMap.getViewport();
        viewPort.classList.add(ACTIVE_CLASS);

        return {
            drawBox: draw,
            destroy() {
                olMap.removeInteraction(draw);
                draw.dispose();
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.remove(INACTIVE_CLASS);
            }
        };
    }

    /**
     * Method for create a simple extent-selection
     * @param olMap
     * @param onExtentSelected
     * @returns
     */
    private createDragBox(olMap: OlMap, onExtentSelected: (geometry: Geometry) => void) {
        const dragBox = new DragBox({
            className: "selection-drag-box",
            condition: mouseActionButton
        });

        olMap.addInteraction(dragBox);
        dragBox.on("boxend", function () {
            onExtentSelected(dragBox.getGeometry());
        });

        const viewPort = olMap.getViewport();
        viewPort.classList.add(ACTIVE_CLASS);

        return {
            dragBox: dragBox,
            destroy() {
                olMap.removeInteraction(dragBox);
                dragBox.dispose();
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.remove(INACTIVE_CLASS);
            }
        };
    }

    /**
     * Method to generate a tooltip on the mouse cursor
     * @param olMap
     * @param message
     * @returns
     */
    private createHelpTooltip(olMap: OlMap, message: string) {
        const element = document.createElement("div");
        element.className = "select-tooltip";
        element.textContent = message;

        const overlay = new Overlay({
            element: element,
            offset: [15, 0],
            positioning: "center-left"
        });

        const pointHandler = olMap.on("pointermove", (evt) => {
            overlay.setPosition(evt.coordinate);
        });

        olMap.addOverlay(overlay);
        return {
            overlay,
            element,
            destroy() {
                olMap.removeOverlay(overlay);
                overlay.dispose();
                unByKey(pointHandler);
            }
        };
    }

    /**
     * Method for testing purposes only
     * @returns class DragBox
     */
    getDragBox() {
        return this.dragBox;
    }

    // TODO: Use style/color from theme
    //       BOX_DRAW-Logik is just implemented to compare it with "right click" dragging. Could be removed
    private getDefaultBoxFeatureStyle() {
        return [
            new Style({
                stroke: new Stroke({
                    color: "#fff",
                    lineDash: [10, 10],
                    width: 5
                })
            }),
            new Style({
                fill: new Fill({
                    color: "rgba(0,0,0,0.15)"
                }),
                stroke: new Stroke({
                    color: "rgba(0, 0, 0, 0.7)",
                    lineDash: [10, 10],
                    width: 3
                }),
                image: new CircleStyle({
                    radius: 5,
                    stroke: new Stroke({
                        color: "rgba(0, 0, 0, 0.7)",
                        width: 2
                    }),
                    fill: new Fill({
                        color: "rgba(255, 255, 255, 0.2)"
                    })
                })
            })
        ];
    }
}
