// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SystemStyleObject } from "@chakra-ui/react";
import { MapAnchorPosition } from "./MapAnchor";

export function computeMapAnchorStyles(
    position: MapAnchorPosition,
    horizontalGap?: number | undefined,
    verticalGap?: number | undefined
): SystemStyleObject {
    const horizontal = horizontalGap ?? 0;
    const vertical = verticalGap ?? 0;
    const attributionGap = verticalGap == null ? ATTR_GAP : 0;

    const styleProps: SystemStyleObject = {};
    switch (position) {
        case "top-left":
            styleProps.left = `${horizontal}px`;
            styleProps.top = `${vertical}px`;
            break;
        case "top-right":
            styleProps.right = `${horizontal}px`;
            styleProps.top = `${vertical}px`;
            break;
        case "bottom-left":
            styleProps.left = `${horizontal}px`;
            styleProps.bottom = `${vertical + attributionGap}px`;
            break;
        case "bottom-right":
            styleProps.right = `${horizontal}px`;
            styleProps.bottom = `${vertical + attributionGap}px`;
            break;
        case "top-center":
            styleProps.top = `${vertical}px`;
            styleProps.left = `calc((100% - ${horizontal}px) / 2)`;
            styleProps.transform = "translateX(-50%)";
            break;
        case "bottom-center":
            styleProps.bottom = `${vertical + attributionGap}px`;
            styleProps.left = `calc((100% - ${horizontal}px) / 2)`;
            styleProps.transform = "translateX(-50%)";
            break;
        case "left-center":
            styleProps.left = `${horizontal}px`;
            styleProps.top = `calc((100% - ${vertical}px) / 2)`;
            styleProps.transform = "translateY(-50%)";
            break;
        case "right-center":
            styleProps.right = `${horizontal}px`;
            styleProps.top = `calc((100% - ${vertical}px) / 2)`;
            styleProps.transform = "translateY(-50%)";
            break;
        case "center":
            styleProps.top = `calc((100% - ${vertical}px) / 2)`;
            styleProps.left = `calc((100% - ${horizontal}px) / 2)`;
            styleProps.transform = "translate(-50%, -50%)";
            break;
    }

    styleProps.maxW = `calc((100%) - ${2 * horizontal}px)`;
    styleProps.maxH = `calc((100%) - ${attributionGap}px - ${2 * vertical}px)`;
    return styleProps;
}

/**
 * height of the ol attribution component
 * improvement: Get height directly from `Attribution` HTMLDivElement
 */
const ATTR_HEIGHT = 20;

/**
 * additional space between attribution and map anchor container
 */
const ATTR_SPACE = 10;
const ATTR_GAP = ATTR_HEIGHT + ATTR_SPACE;
