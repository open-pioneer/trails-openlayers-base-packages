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
        positioning: "center-left",
        ariaRole: "tooltip",
        className: "editing-tooltip"
    });

    return {
        destroy() {
            overlay.destroy();
        },
        setVisible(visible) {
            overlay.classList.toggle("editing-tooltip-hidden", !visible);
        },
        setText(text) {
            overlay.setContent(text);
        }
    };
}
