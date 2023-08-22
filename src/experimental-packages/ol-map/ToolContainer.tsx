// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, StyleProps } from "@open-pioneer/chakra-integration";
import classNames from "classnames";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMapContext } from "./MapContext";
import { MapPadding } from "./MapContainer";

export type ToolContainerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface ToolContainerSpacing {
    horizontal: number;
    vertical: number;
}

export interface ToolContainerProps {
    /**
     * The position of the container above the map.
     * @default "top-right"
     */
    position?: ToolContainerPosition;
    className?: string | undefined;
    children?: ReactNode;
    toolContainerSpacing?: ToolContainerSpacing;
}

export function ToolContainer(props: ToolContainerProps ): JSX.Element {
    const { position = "top-right", className, children, toolContainerSpacing } = props;
    const { map, padding } = useMapContext();
    const overlayContainer = map.getOverlayContainerStopEvent();

    return createPortal(
        <Box
            className={classNames("tool-container", className)}
            /* Overlay container uses pointer-events: none, this restores interactivity */
            pointerEvents="auto"
            /* Restore user-select: none set by ol-viewport parent */
            userSelect="text"
            {...computePositionStyles(position, padding, toolContainerSpacing)}
        >
            {children}
        </Box>,
        overlayContainer
    );
}

function computePositionStyles(
    position: ToolContainerPosition,
    padding: Required<MapPadding>,
    toolContainerSpacing: ToolContainerSpacing | undefined
): StyleProps {
    const props: StyleProps = {
        position: "absolute",
        transitionProperty: "left, right, top, bottom",
        transitionDuration: "200ms",
        transitionTimingFunction: "ease-out"
    };
    const defaultSpacing = 0;
    const attributionSpacing = 20;

    const gap = (n: number) => `${n}px`;

    if (!toolContainerSpacing) {
        toolContainerSpacing = {
            horizontal: defaultSpacing,
            vertical: defaultSpacing
        };
    } else if (toolContainerSpacing.horizontal == undefined) {
        toolContainerSpacing.horizontal = defaultSpacing;
    } else if (toolContainerSpacing.vertical == undefined) {
        toolContainerSpacing.vertical = defaultSpacing;
    }

    switch (position) {
        case "top-left":
            props.left = gap(padding.left + toolContainerSpacing.horizontal);
            props.top = gap(padding.top + toolContainerSpacing.vertical);
            break;
        case "top-right":
            props.right = gap(padding.right + toolContainerSpacing.horizontal);
            props.top = gap(padding.top + toolContainerSpacing.vertical);
            break;
        case "bottom-left":
            props.left = gap(padding.left + toolContainerSpacing.horizontal);
            props.bottom = gap(padding.bottom + toolContainerSpacing.vertical + attributionSpacing);
            break;
        case "bottom-right":
            props.right = gap(padding.right + toolContainerSpacing.horizontal);
            props.bottom = gap(padding.bottom + toolContainerSpacing.vertical+ attributionSpacing);
            break;
    }
    return props;
}
