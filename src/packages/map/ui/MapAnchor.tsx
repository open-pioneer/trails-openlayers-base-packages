// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { computeMapAnchorStyles } from "./computeMapAnchorStyles";
import { useMapContainerContext } from "./MapContainerContext";
import { StyleProps } from "@open-pioneer/chakra-integration";
import { PADDING_BOTTOM, PADDING_LEFT, PADDING_RIGHT, PADDING_TOP } from "./CssProps";

export type MapAnchorPosition =
    | "top-left"
    | "top-right"
    | "top-h-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-h-center"
    | "v-center-left"
    | "v-center-right"
    | "v-center-h-center";

const defaultPosition: MapAnchorPosition = "top-right";

export interface MapAnchorProps extends CommonComponentProps {
    children?: ReactNode;
}

export interface MapAnchorShortcut extends MapAnchorProps {
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
     * - center, if position `*-hCenter`
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
     * - center, if position `vCenter-*`
     *
     * @default 0 (If position `bottom-*`, default verticalGap == `30`)
     */
    verticalGap?: number;

    top?: never;
    bottom?: never;
    left?: never;
    right?: never;
}

export interface MapAnchorStyleProps extends MapAnchorProps {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;

    position?: never;
    verticalGap?: never;
    horizontalGap?: never;
}

export function MapAnchor(props: MapAnchorShortcut | MapAnchorStyleProps): ReactNode {
    const {
        position = defaultPosition,
        children,
        horizontalGap,
        verticalGap,
        top,
        bottom,
        left,
        right
    } = props;
    const { containerProps } = useCommonComponentProps("map-anchor", props);
    const { mapAnchorsHost } = useMapContainerContext();
    let styleProps: StyleProps = {};
    if (position != undefined || verticalGap != undefined || horizontalGap != undefined)
        styleProps = computeMapAnchorStyles(position, horizontalGap, verticalGap);
    if (top != undefined || bottom != undefined || left != undefined || right != undefined) {
        styleProps.top = top ? `${top}px` : undefined;
        styleProps.bottom = bottom ? `${bottom}px` : undefined;
        styleProps.left = left ? `${left}px` : undefined;
        styleProps.right = right ? `${right}px` : undefined;
        if (top != undefined && bottom != undefined) {
            styleProps.maxH = `calc((100%) - ${top + "px"} - ${bottom + "px"})`;
        }
        if (left != undefined && right != undefined) {
            styleProps.maxW = `calc((100%) - ${left + "px"} - ${right + "px"})`;
        }
    }
    mapAnchorsHost.style.left = PADDING_LEFT.ref;
    mapAnchorsHost.style.right = PADDING_RIGHT.ref;
    mapAnchorsHost.style.top = PADDING_TOP.ref;
    mapAnchorsHost.style.bottom = PADDING_BOTTOM.ref;
    mapAnchorsHost.style.height = `calc(100% - ${PADDING_BOTTOM + "px"} - ${PADDING_TOP + "px"}`;
    mapAnchorsHost.style.width = `calc(100% - ${PADDING_LEFT + "px"} - ${PADDING_RIGHT + "px"}`;
    mapAnchorsHost.style.position = "absolute";
    return createPortal(
        <Box {...containerProps} {...styleProps}>
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
