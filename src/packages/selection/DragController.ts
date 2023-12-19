// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core/resources";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import { mouseActionButton } from "ol/events/condition";
import Geometry from "ol/geom/Geometry";
import { SelectionMethods } from "./Selection";
import { DragBox, DragPan } from "ol/interaction";

interface SelectionBox extends Resource {
    dragBox: DragBox;
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
    }

    setActive(isActive: boolean) {
        if (this.isActive === isActive || !this.dragBox) return;
        const viewPort = this.olMap.getViewport();
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
    }

    /**
     * Method for create a simple extent-selection
     * @param olMap
     * @param onExtentSelected
     * @returns
     */
    private createDragBox(olMap: OlMap, onExtentSelected: (geometry: Geometry) => void) {
        const viewPort = olMap.getViewport();
        viewPort.classList.add(ACTIVE_CLASS);

        viewPort.oncontextmenu = (e) => {
            e.preventDefault();
            return false;
        };
        const dragBox = new DragBox({
            className: "selection-drag-box",
            condition: mouseActionButton
        });

        const drag = this.createDrag();
        olMap.addInteraction(drag);
        olMap.addInteraction(dragBox);
        dragBox.on("boxend", function () {
            onExtentSelected(dragBox.getGeometry());
        });

        return {
            dragBox: dragBox,
            destroy() {
                olMap.removeInteraction(dragBox);
                olMap.removeInteraction(drag);
                dragBox.dispose();
                drag.dispose();
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.remove(INACTIVE_CLASS);
                viewPort.oncontextmenu = null;
            }
        };
    }

    /**
     * Method to activate pan with right-mouse-click
     * @returns
     */
    private createDrag() {
        const condition = function (mapBrowserEvent: {
            originalEvent: MouseEvent;
            dragging: unknown;
        }) {
            const originalEvent = /** @type {MouseEvent} */ mapBrowserEvent.originalEvent;
            return originalEvent.button == 2;
        };
        const drag = new DragPan({
            condition: condition
        });

        return drag;
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
}
