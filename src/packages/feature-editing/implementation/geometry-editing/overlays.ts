// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { MapModel, Overlay } from "@open-pioneer/map";
import { TooltipBox } from "@open-pioneer/map-ui-components";
import { createElement, ReactNode } from "react";

export function createHelpTooltip(mapModel: MapModel, tag: string, content: ReactNode): Overlay {
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
