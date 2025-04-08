// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { StyleProps } from "@open-pioneer/chakra-integration";
import { MapAnchorPosition } from "./MapAnchor";

export function computeMapAnchorStyles(
    position: MapAnchorPosition,
    horizontalGap?: number | undefined,
    verticalGap?: number | undefined
): StyleProps {
    const horizontal = horizontalGap ?? 0;
    const vertical = verticalGap ?? 0;
    const attribution = computeAttributionGap(verticalGap);

    const styleProps: StyleProps = {};
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
            styleProps.bottom = `${vertical + attribution.gap}px`;
            break;
        case "bottom-right":
            styleProps.right = `${horizontal}px`;
            styleProps.bottom = `${vertical + attribution.gap}px`;
            break;
        case "top-h-center":
            styleProps.top = `${vertical}px`;
            styleProps.left = `calc((100% - ${horizontal}px) / 2)`;
            styleProps.transform = "translateX(-50%)";
            break;
        case "bottom-h-center":
            styleProps.bottom = `${vertical + attribution.gap}px`;
            styleProps.left = `calc((100% - ${horizontal}px) / 2)`;
            styleProps.transform = "translateX(-50%)";
            break;
        case "v-center-left":
            styleProps.left = `${horizontal}px`;
            styleProps.top = `calc((100% - ${vertical}px) / 2)`;
            styleProps.transform = "translateY(-50%)";
            break;
        case "v-center-right":
            styleProps.right = `${horizontal}px`;
            styleProps.top = `calc((100% - ${vertical}px) / 2)`;
            styleProps.transform = "translateY(-50%)";
            break;
        case "v-center-h-center":
            styleProps.top = `calc((100% - ${vertical}px) / 2)`;
            styleProps.left = `calc((100% - ${horizontal}px) / 2)`;
            styleProps.transform = "translate(-50%, -50%)";
            break;
    }

    /**
     * TODO: Apply max-height and max-width to MapAnchor to avoid content overflow
     */
    // styleProps.maxH = `calc((100%) - ${defaultValue(posExprs.top, "0px")} - ${defaultValue(posExprs.bottom, attribution.gap + "px")} - ${vertical}px - ${attribution.space}px)`;
    // styleProps.maxW = `calc((100%) - ${defaultValue(posExprs.left, "0px")} - ${defaultValue(posExprs.right, "0px")} - ${horizontal}px)`;
    return styleProps;
}

function computeAttributionGap(verticalGap?: number): {
    gap: number;
    space: number;
} {
    /**
     * height of the ol attribution component
     * improvement: Get height directly from `Attribution` HTMLDivElement
     */
    const height = 20;

    /**
     * additional space between attribution and map anchor container
     */
    const space = 10;

    return {
        gap: verticalGap === undefined ? height + space : 0,
        space
    };
}
