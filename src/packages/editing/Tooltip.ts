// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Resource } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { TooltipBox } from "@open-pioneer/map-ui-components";
import { createElement } from "react";

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
    let currentText = text;
    let visible = false;

    const renderContent = () =>
        createElement(TooltipBox, { visibility: visible ? undefined : "hidden" }, currentText);

    const overlay = map.overlays.add({
        content: renderContent(),
        position: "follow-pointer",
        offset: [15, 0],
        positioning: "center-left",
        ariaRole: "tooltip",
        className: "editing-tooltip"
    });

    return {
        destroy() {
            overlay.destroy();
        },
        setVisible(newVisible) {
            if (visible === newVisible) {
                return;
            }
            visible = newVisible;
            overlay.setContent(renderContent());
        },
        setText(newText) {
            if (currentText === newText) {
                return;
            }
            currentText = newText;
            overlay.setContent(renderContent());
        }
    };
}
