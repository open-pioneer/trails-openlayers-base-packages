// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@open-pioneer/chakra-integration";
import classNames from "classnames";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMapContext } from "./MapContext";

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
    const { map } = useMapContext();
    const overlayContainer = map.getOverlayContainerStopEvent();

    return createPortal(
        <Box className={classNames("tool-container", className)}>{children}</Box>,
        overlayContainer
    );
}
