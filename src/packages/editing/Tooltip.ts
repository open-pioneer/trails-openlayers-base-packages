// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";

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
export function createTooltip(map: MapModel, text: string): Tooltip {
    const overlay = map.overlays.addOverlay({
        content: text,
        mode: "followPointer",
        offset: [15, 0],
        positioning: "center-left"
    });

    // const element = document.createElement("div");
    // element.className = "editing-tooltip editing-tooltip-hidden";
    // element.role = "tooltip";

    //
    // element.appendChild(content);

    // const overlay = new Overlay({
    //     element: element,
    //     offset: [15, 0],
    //     positioning: "center-left"
    // });

    // const pointerMove = olMap.on("pointermove", (evt) => {
    //     if (evt.dragging) {
    //         return;
    //     }

    //     overlay.setPosition(evt.coordinate);
    // });

    // olMap.addOverlay(overlay);
    return {
        destroy() {
            overlay.destroy();
        },
        setVisible(visible) {
            if (!visible) {
                overlay.setClassName(overlay.className + "editing-tooltip-hidden");
            } else {
                overlay.setClassName(overlay.className.replace("editing-tooltip-hidden", ""));
            }
        },
        setText(text) {
            overlay.setContent(text);
        }
    };
}
