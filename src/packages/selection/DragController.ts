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
        switch (selectMethode) {
            case SelectionMethods.extent:
                this.dragBox = this.createDragBox(olMap, onExtentSelected);
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

    getDragBox() {
        return this.dragBox;
    }
}
