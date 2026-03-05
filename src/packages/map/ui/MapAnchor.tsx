// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps } from "@chakra-ui/react";
import {
    CommonComponentProps,
    mergeChakraProps,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { ReactNode, useMemo } from "react";
import { createPortal } from "react-dom";
import { computeMapAnchorStyles } from "./computeMapAnchorStyles";
import { useMapContainerContext } from "./MapContainerContext";

/**
 * The position of an anchor on the map.
 *
 * This is either a predefined position (like a corner) or a completely manual position.
 *
 * @group UI Components and Hooks
 */
export type MapAnchorPosition =
    | "manual"
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
    | "left-center"
    | "right-center"
    | "center";

const defaultPosition: MapAnchorPosition = "top-right";

/**
 * @group UI Components and Hooks
 */
export interface MapAnchorProps extends CommonComponentProps {
    /**
     * The position of the anchor container above the map.
     *
     * Use `manual` if you wish to position the anchor manually using absolute positioning.
     * This can be achieved by configuring a css class on the map anchor and using css properties like `left`, `top`, etc.
     *
     * @default "top-right"
     */
    position?: MapAnchorPosition;

    /**
     * Horizontal gap in pixel applied to anchor container.
     * Only interpreted if a non-manual position is used.
     *
     * @default 0
     */
    horizontalGap?: number;

    /**
     * Vertical gap in pixel applied to anchor container.
     * Only interpreted if a non-manual position is used.
     *
     * @default 0 (If positioned at the bottom, default verticalGap == `30`)
     */
    verticalGap?: number;

    children?: ReactNode;
}

/**
 * A map anchor is a layout component that sits on top of the map.
 *
 * It can be used to position widgets (such as zoom buttons) at a specific location.
 *
 * Map anchors respect the map's current _view padding_.
 *
 * @group UI Components and Hooks
 */
export function MapAnchor(props: MapAnchorProps): ReactNode {
    const { position = defaultPosition, children, horizontalGap, verticalGap } = props;
    const { containerProps } = useCommonComponentProps("map-anchor", props);
    const { mapAnchorsHost } = useMapContainerContext();
    const css = useMemo(
        () => computeMapAnchorStyles(position, horizontalGap, verticalGap),
        [position, horizontalGap, verticalGap]
    );

    const boxProps = mergeChakraProps<BoxProps>(
        {
            css
        },
        containerProps
    );
    return createPortal(<Box {...boxProps}>{children}</Box>, mapAnchorsHost);
}
