// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core/resources";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import { mouseActionButton } from "ol/events/condition";
import Geometry from "ol/geom/Geometry";
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

export class DragController {
    private tooltip: Tooltip;
    private dragBox: SelectionBox;

    constructor(
        olMap: OlMap,
        tooltipMessage: string,
        onExtentSelected: (geometry: Geometry) => void
    ) {
        this.dragBox = this.createDragBox(olMap, onExtentSelected);
        this.tooltip = this.createHelpTooltip(olMap, tooltipMessage);
    }

    destroy() {
        this.tooltip.destroy();
        this.dragBox.destroy();
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

        const element = olMap.getViewport();
        element.classList.add(ACTIVE_CLASS);

        return {
            dragBox: dragBox,
            destroy() {
                olMap.removeInteraction(dragBox);
                dragBox.dispose();
                element.classList.remove(ACTIVE_CLASS);
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
}
