// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, StyleProps } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMapContext } from "./MapContext";
import { PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP } from "./CssProps";

export type MapAnchorPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const defaultPosition: MapAnchorPosition = "top-right";

export interface MapAnchorProps extends CommonComponentProps {
    /**
     * The position of the anchor container above the map.
     * @default "top-right"
     */
    position?: MapAnchorPosition;

    /**
     * Horizontal gap in pixel applied to anchor container.
     *
     * Applied:
     * - left, if position `*-left`
     * - right, if position `*-right`
     *
     * @default 0
     */
    horizontalGap?: number;

    /**
     * Vertical gap in pixel applied to anchor container.
     *
     * Applied:
     * - top, if position `top-*`
     * - bottom, if position `bottom-*`
     *
     * @default 0 (If position `bottom-*`, default verticalGap == `30`)
     */
    verticalGap?: number;

    children?: ReactNode;
}

export function MapAnchor(props: MapAnchorProps): JSX.Element {
    const { position = defaultPosition, children, horizontalGap, verticalGap } = props;
    const { containerProps } = useCommonComponentProps("map-anchor", props);
    const { mapAnchorsHost } = useMapContext();

    return createPortal(
        <Box {...containerProps} {...computePositionStyles(position, horizontalGap, verticalGap)}>
            {children}
        </Box>,
        mapAnchorsHost
    );
}

export function computeAttributionGap(verticalGap?: number): {
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

export function computePositionStyles(
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
