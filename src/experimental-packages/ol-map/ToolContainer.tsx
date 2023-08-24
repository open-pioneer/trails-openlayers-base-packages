// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, StyleProps } from "@open-pioneer/chakra-integration";
import classNames from "classnames";
import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMapContext } from "./MapContext";
import { MapPadding } from "./MapContainer";

export type ToolContainerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// TODO: Branch umbennen, wenn MapAPI fertig und Implementierung übernehmen
// TODO: Doku anpassen -> Tab order tool container richtige Reihenfolge konfigurieren
// TODO: Tests

export interface ToolContainerProps {
    /**
     * The position of the container above the map.
     * @default "top-right"
     */
    position?: ToolContainerPosition;
    className?: string | undefined;
    children?: ReactNode;
    /**
     * Horizontal gap in pixel applied to ToolContainer.
     *
     * Applied:
     * - left, if position `*-left`
     * - right, if position `*-right`
     *
     * @default 0
     */
    horizontalGap?: number;
    /**
     * Vertical gap in pixel applied to ToolContainer.
     *
     * Applied:
     * - top, if position `*-top`
     * - bottom, if position `*-bottom`
     *
     * @default 0 (If position `*-bottom`, default verticalGap == `30`)
     */
    verticalGap?: number;
}

export function ToolContainer(props: ToolContainerProps): JSX.Element {
    const { position = "top-right", className, children, horizontalGap, verticalGap } = props;
    const { map, padding } = useMapContext();
    const overlayContainer = map.getOverlayContainerStopEvent();

    return createPortal(
        <Box
            className={classNames("tool-container", className)}
            /* Overlay container uses pointer-events: none, this restores interactivity */
            pointerEvents="auto"
            /* Restore user-select: none set by ol-viewport parent */
            userSelect="text"
            {...computePositionStyles(position, padding, horizontalGap, verticalGap)}
        >
            {children}
        </Box>,
        overlayContainer
    );
}

export function computePositionStyles(
    position: ToolContainerPosition,
    padding: Required<MapPadding>,
    horizontalGap?: number | undefined,
    verticalGap?: number | undefined
): StyleProps {
    const props: StyleProps = {
        position: "absolute",
        transitionProperty: "left, right, top, bottom",
        transitionDuration: "200ms",
        transitionTimingFunction: "ease-out"
    };

    const defaultHorizontalGap = 0;
    const horizontal = horizontalGap ?? defaultHorizontalGap;

    const defaultVerticalGap = 0;
    const vertical = verticalGap ?? defaultVerticalGap;

    /**
     * improvement: Get height directly from `Attribution` HTMLDivElement
     */
    const attributionHeight = 20;
    const attributionSpace = 10;
    const attributionGap = verticalGap === undefined ? attributionHeight + attributionSpace : 0;

    const gap = (n: number) => `${n}px`;

    switch (position) {
        case "top-left":
            props.left = gap(padding.left + horizontal);
            props.top = gap(padding.top + vertical);
            break;
        case "top-right":
            props.right = gap(padding.right + horizontal);
            props.top = gap(padding.top + vertical);
            break;
        case "bottom-left":
            props.left = gap(padding.left + horizontal);
            props.bottom = gap(padding.bottom + vertical + attributionGap);
            break;
        case "bottom-right":
            props.right = gap(padding.right + horizontal);
            props.bottom = gap(padding.bottom + vertical + attributionGap);
            break;
    }

    /**
     * Apply max-height and max-width to ToolContainer to avoid content overflow
     */
    props.maxH = `calc((100%) - ${props.top ?? "0px"} - ${
        props.bottom ?? attributionGap + "px"
    } - ${vertical + "px"} - ${attributionSpace + "px"})`;

    props.maxW = `calc((100%) - ${props.left ?? "0px"} - ${props.right ?? "0px"} - ${
        horizontal + "px"
    })`;
    props.overflow = "hidden";

    return props;
}
