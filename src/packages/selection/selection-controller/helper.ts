// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import { Overlay } from "ol";
import OlMap from "ol/map";
import { unByKey } from "ol/Observable";

const ACTIVE_CLASS = "selection-active";
const INACTIVE_CLASS = "selection-inactive";

/** Represents a tooltip rendered on the OpenLayers map. */
export interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
    setText(value: string): void;
}

/**
 * Applies appropriate css classes to the viewport to indicate the active selection process
 */
export function activateViewportInteraction(map: OlMap) {
    const viewPort = map.getViewport();
    viewPort.classList.remove(INACTIVE_CLASS);
    viewPort.classList.add(ACTIVE_CLASS);
}

/**
 * Applies appropriate css classes from the viewport to indicate that the selection process is inactive
 */
export function deactivateViewportInteraction(map: OlMap) {
    const viewPort = map.getViewport();
    viewPort.classList.remove(ACTIVE_CLASS);
    viewPort.classList.add(INACTIVE_CLASS);
}

/**
 * Method to generate a tooltip on the mouse cursor
 */
export function createHelpTooltip(olMap: OlMap, message: string): Tooltip {
    const element = document.createElement("div");
    element.className = "selection-tooltip printing-hide";
    element.role = "tooltip";

    const content = document.createElement("span");
    content.textContent = message;
    element.appendChild(content);

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
        },
        setText(value) {
            content.textContent = value;
        }
    };
}