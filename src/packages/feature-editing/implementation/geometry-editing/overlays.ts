// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapModel, Overlay } from "@open-pioneer/map";
import { TooltipBox } from "@open-pioneer/map-ui-components";
import { createElement, ReactNode } from "react";

/**
 * Creates a help tooltip that follows the mouse pointer.
 *
 * Returns `undefined` if there is no content to display: an empty tooltip would
 * still be rendered as a visible (but empty) box.
 */
export function createHelpTooltip(
    mapModel: MapModel,
    tag: string,
    content: ReactNode
): Overlay | undefined {
    if (!content) {
        return undefined;
    }

    const helpOverlay = mapModel.overlays.add({
        className: "editing-tooltip printing-hide",
        position: "follow-pointer",
        tag,
        offset: [15, 0],
        positioning: "center-left",
        ariaRole: "tooltip",
        content: createElement(TooltipBox, undefined, content)
    });

    return helpOverlay;
}
