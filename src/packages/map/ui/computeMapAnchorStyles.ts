// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { StyleProps } from "@open-pioneer/chakra-integration";
import { PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP } from "./CssProps";
import { computeAttributionGap, MapAnchorPosition } from "./MapAnchor";

export function computeMapAnchorStyles(
    position: MapAnchorPosition,
    horizontalGap?: number | undefined,
    verticalGap?: number | undefined
): StyleProps {
    const styleProps: StyleProps = {
        position: "absolute",
        zIndex: 1, // above map
        transitionProperty: "left, right, top, bottom",
        transitionDuration: "200ms",
        transitionTimingFunction: "ease-out",
        overflow: "hidden"
    };

    const defaultHorizontalGap = 0;
    const horizontal = horizontalGap ?? defaultHorizontalGap;

    const defaultVerticalGap = 0;
    const vertical = verticalGap ?? defaultVerticalGap;

    const attribution = computeAttributionGap(verticalGap);
    const gap = (paddingProp: string, pixels: number) => `(${paddingProp} + ${pixels}px)`;

    interface PosExprs {
        left?: string;
        right?: string;
        top?: string;
        bottom?: string;
    }

    // CSS Expressions for inside calc(...)
    const posExprs: PosExprs = {};
    switch (position) {
        case "top-left":
            posExprs.left = gap(PADDING_LEFT.ref, horizontal);
            posExprs.top = gap(PADDING_TOP.ref, vertical);
            break;
        case "top-right":
            posExprs.right = gap(PADDING_RIGHT.ref, horizontal);
            posExprs.top = gap(PADDING_TOP.ref, vertical);
            break;
        case "bottom-left":
            posExprs.left = gap(PADDING_LEFT.ref, horizontal);
            posExprs.bottom = gap(PADDING_BOTTOM.ref, vertical + attribution.gap);
            break;
        case "bottom-right":
            posExprs.right = gap(PADDING_RIGHT.ref, horizontal);
            posExprs.bottom = gap(PADDING_BOTTOM.ref, vertical + attribution.gap);
            break;
    }

    for (const [key, value] of Object.entries(posExprs)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (styleProps as any)[key] = `calc(${value})`;
    }

    /**
     * Apply max-height and max-width to MapAnchor to avoid content overflow
     */
    styleProps.maxH = `calc((100%) - ${defaultValue(posExprs.top, "0px")} - ${defaultValue(posExprs.bottom, attribution.gap + "px")} - ${vertical}px - ${attribution.space}px)`;
    styleProps.maxW = `calc((100%) - ${defaultValue(posExprs.left, "0px")} - ${defaultValue(posExprs.right, "0px")} - ${horizontal}px)`;
    return styleProps;
}

function defaultValue(value: string | undefined, defaultValue: string): string {
    return value ?? defaultValue;
}
