// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, StyleProps } from "@open-pioneer/chakra-integration";
import classNames from "classnames";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMapContext } from "./MapContext";
import { MapPadding } from "./MapContainer";

export type ToolContainerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ToolContainerProps {
    /**
     * The position of the container above the map.
     * @default "top-right"
     */
    position?: ToolContainerPosition;
    className?: string | undefined;
    children?: ReactNode;
}

export function ToolContainer(props: ToolContainerProps): JSX.Element {
    const { position = "top-right", className, children } = props;
    const { map, padding } = useMapContext();
    const overlayContainer = map.getOverlayContainerStopEvent();

    return createPortal(
        <Box
            className={classNames("tool-container", className)}
            /* Overlay container uses pointer-events: none, this restores interactivity */
            pointerEvents="auto"
            /* Restore user-select: none set by ol-viewport parent */
            userSelect="text"
            {...computePositionStyles(position, padding)}
        >
            {children}
        </Box>,
        overlayContainer
    );
}

function computePositionStyles(
    position: ToolContainerPosition,
    padding: Required<MapPadding>
): StyleProps {
    const props: StyleProps = {
        position: "absolute",
        transitionProperty: "left, right, top, bottom",
        transitionDuration: "200ms",
        transitionTimingFunction: "ease-out"
    };

    // TODO: Disable/Override default padding?
    const defaultPadding = 12; // pixels
    const gap = (n: number) => `${defaultPadding + n}px`;

    switch (position) {
        case "top-left":
            props.left = gap(padding.left);
            props.top = gap(padding.top);
            break;
        case "top-right":
            props.right = gap(padding.right);
            props.top = gap(padding.top);
            break;
        case "bottom-left":
            props.left = gap(padding.left);
            props.bottom = gap(padding.bottom + 20); // TODO: Account for attribution?!
            break;
        case "bottom-right":
            props.right = gap(padding.right);
            props.bottom = gap(padding.bottom + 20); // TODO: Account for attribution?!
            break;
    }
    return props;
}
