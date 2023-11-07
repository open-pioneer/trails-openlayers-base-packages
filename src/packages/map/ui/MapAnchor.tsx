// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, BoxProps, StyleProps } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { BaseSyntheticEvent, ReactNode, useMemo } from "react";
import { createPortal } from "react-dom";
import { MapPadding } from "./MapContainer";
import { useMapContext } from "./MapContext";

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

    /**
     * Prevent some events from the map anchor's children from bubbling towards the map, effectively hiding them from map interactions.
     * Defaults to `true`.
     *
     * If this value is enabled, events such as `pointer-down` are hidden from the map when they occur
     * within the map anchor.
     * This is essential when the user wants to select text, or open the browser context menu within the anchor.
     * If that is not required, set `stopEvents` to `false` instead.
     */
    stopEvents?: boolean;

    children?: ReactNode;
}

export function MapAnchor(props: MapAnchorProps): JSX.Element {
    const {
        position = defaultPosition,
        stopEvents = true,
        children,
        horizontalGap,
        verticalGap
    } = props;
    const { containerProps } = useCommonComponentProps("map-anchor", props);
    const { padding, mapAnchorsHost } = useMapContext();

    const eventHandlers: Partial<BoxProps> = useMemo(() => {
        const stopHandler = stopEvents ? stopPropagation : undefined;
        return {
            onPointerDown: stopHandler,
            onPointerUp: stopHandler,
            onContextMenu: stopHandler
        };
    }, [stopEvents]);

    return createPortal(
        <Box
            {...containerProps}
            /* Overlay container uses pointer-events: none, this restores interactivity */
            pointerEvents="auto"
            /* Restore user-select: none set by ol-viewport parent */
            userSelect="text"
            /** Hide pointer up/down and context menu events from the map parent.  */
            {...eventHandlers}
            {...computePositionStyles(position, padding, horizontalGap, verticalGap)}
        >
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

    const attribution = computeAttributionGap(verticalGap);
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
            props.bottom = gap(padding.bottom + vertical + attribution.gap);
            break;
        case "bottom-right":
            props.right = gap(padding.right + horizontal);
            props.bottom = gap(padding.bottom + vertical + attribution.gap);
            break;
    }

    /**
     * Apply max-height and max-width to MapAnchor to avoid content overflow
     */
    props.maxH = `calc((100%) - ${props.top ?? "0px"} - ${
        props.bottom ?? attribution.gap + "px"
    } - ${vertical + "px"} - ${attribution.space + "px"})`;

    props.maxW = `calc((100%) - ${props.left ?? "0px"} - ${props.right ?? "0px"} - ${
        horizontal + "px"
    })`;
    props.overflow = "hidden";

    return props;
}

function stopPropagation(e: BaseSyntheticEvent) {
    e.stopPropagation();
}
