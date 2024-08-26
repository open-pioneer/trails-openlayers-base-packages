// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import { Overlay } from "ol";
import type OlMap from "ol/Map";
import { unByKey } from "ol/Observable";

/**
 * Represents a tooltip rendered on the OpenLayers map
 */
export interface Tooltip extends Resource {
    setVisible(visible: boolean): void;
    setText(text: string): void;
}

/**
 * Creates a new tooltip on the given map, with the given text content.
 *
 * The tooltip will follow the mouse while it moves over the map.
 *
 * Note: the tooltip starts invisible, and must be toggled on via `setVisible(true)`.
 */
export function createTooltip(olMap: OlMap, text: string): Tooltip {
    const element = document.createElement("div");
    element.className = "editing-tooltip editing-tooltip-hidden";
    element.role = "tooltip";

    const content = document.createElement("span");
    content.textContent = text;
    element.appendChild(content);

    const overlay = new Overlay({
        element: element,
        offset: [15, 0],
        positioning: "center-left"
    });

    const pointerMove = olMap.on("pointermove", (evt) => {
        if (evt.dragging) {
            return;
        }

        overlay.setPosition(evt.coordinate);
    });

    olMap.addOverlay(overlay);
    return {
        destroy() {
            unByKey(pointerMove);
            olMap.removeOverlay(overlay);
        },
        setVisible(visible) {
            element.classList.toggle("editing-tooltip-hidden", !visible);
        },
        setText(text) {
            content.textContent = text;
        }
    };
}
