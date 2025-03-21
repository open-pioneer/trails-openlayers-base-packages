// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { computeMapAnchorStyles } from "./computeMapAnchorStyles";
import { useMapContainerContext } from "./MapContainerContext";

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

export function MapAnchor(props: MapAnchorProps): ReactNode {
    const { position = defaultPosition, children, horizontalGap, verticalGap } = props;
    const { containerProps } = useCommonComponentProps("map-anchor", props);
    const { mapAnchorsHost } = useMapContainerContext();

    return createPortal(
        <Box {...containerProps} {...computeMapAnchorStyles(position, horizontalGap, verticalGap)}>
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
