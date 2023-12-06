// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core/resources";
import OlMap from "ol/Map";
import Overlay from "ol/Overlay";
import { mouseActionButton } from "ol/events/condition";
import Geometry from "ol/geom/Geometry";
import { DragBox } from "ol/interaction";

interface Selectionbox extends Resource {
    dragBox: DragBox;
}

/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

export class DragController {
    private olMap: OlMap;
    private messages: string;
    private tooltip: Tooltip;
    private dragBox: Selectionbox;
    constructor(olMap: OlMap, messages: string, extendHandler: (geometry: Geometry) => void) {
        this.olMap = olMap;
        this.messages = messages;
        this.dragBox = this.createDragbox(olMap, extendHandler);
        this.tooltip = this.createHelpTooltip(olMap, messages);
    }

    createDragbox(olMap: OlMap, extendHandler: (geometry: Geometry) => void) {
        const dragBox = new DragBox({
            className: "selectionDragBox",
            condition: mouseActionButton
        });
        olMap.addInteraction(dragBox);
        dragBox.on("boxend", function () {
            extendHandler(dragBox.getGeometry());
        });
        return {
            dragBox: dragBox,
            destroy() {
                olMap.removeInteraction(dragBox);
            }
        };
    }

    createHelpTooltip(olMap: OlMap, message: string) {
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
                olMap.removeEventListener(pointHandler.type, pointHandler.listener);
            }
        };
    }

    destroy() {
        this.tooltip.destroy();
        this.dragBox.destroy();
    }
}
