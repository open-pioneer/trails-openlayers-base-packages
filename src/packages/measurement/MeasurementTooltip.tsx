// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { SystemStyleObject } from "@chakra-ui/react";
import { TooltipBox } from "@open-pioneer/map-ui-components";
import { ReactNode } from "react";

/**
 * The kind of measurement tooltip:
 *
 * - `"help"`: a hint that follows the mouse pointer (styled like a default chakra tooltip)
 * - `"active"`: shows the current value of a measurement that is still being drawn
 * - `"finished"`: shows the final value of a completed measurement
 */
export type MeasurementTooltipKind = "help" | "active" | "finished";

/**
 * Renders the content of a measurement tooltip.
 */
export function MeasurementTooltipContent(props: {
    kind: MeasurementTooltipKind;
    content?: ReactNode;
}) {
    const { kind, content } = props;
    return <TooltipBox css={TOOLTIP_STYLES[kind]}>{content}</TooltipBox>;
}

/**
 * Styles shared by the tooltips that are attached to a measurement geometry.
 *
 * Colors are controlled via css variables:
 * - `--tooltip-bg` (defined by chakra's tooltip recipe) is the background of the box and the arrow
 * - `--tooltip-border` is the outline of the box and the arrow
 */
const MEASUREMENT_STYLES: SystemStyleObject = {
    "--tooltip-border": "transparent",
    position: "relative",
    whiteSpace: "nowrap",
    maxW: "none",
    fontWeight: "bold",
    cursor: "default",
    userSelect: "none",
    border: "1px solid var(--tooltip-border)",

    // Arrow pointing downwards to the measured geometry: a rotated square with a border on
    // its two lower sides. Only the lower half is shown; it starts at the inner edge of the
    // box's border, so it covers the border line where the arrow is attached.
    _before: {
        content: '""',
        position: "absolute",
        bottom: 0,
        left: "50%",
        boxSize: "8px",
        bg: "var(--tooltip-bg)",
        borderWidth: "0 1px 1px 0",
        borderStyle: "solid",
        borderColor: "var(--tooltip-border)",
        transform: "translate(-50%, 50%) rotate(45deg)",
        clipPath: "polygon(100% 0, 100% 100%, 0 100%)"
    }
};

const TOOLTIP_STYLES: Record<MeasurementTooltipKind, SystemStyleObject | undefined> = {
    // Default chakra tooltip
    help: undefined,
    active: {
        ...MEASUREMENT_STYLES,
        "--tooltip-bg": "colors.blackAlpha.900",
        color: "white"
    },
    finished: {
        ...MEASUREMENT_STYLES,
        "--tooltip-bg": "colors.blue.400",
        "--tooltip-border": "white",
        color: "black"
    }
};
