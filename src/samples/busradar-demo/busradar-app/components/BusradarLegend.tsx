// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, chakra, Flex, Text } from "@chakra-ui/react";
import { ToggleTip } from "@open-pioneer/chakra-snippets/toggle-tip";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { useIntl } from "open-pioneer:react-hooks";
import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { getBusradarBusSvgDataUrl, getBusradarDelayStatus } from "../map/layers/busradarLayer";

// Drei Delay-Stufen der Skala (bester → schlechtester Zustand). Die Farben stammen aus der
// zentralen Delay-Farbkonfiguration (getBusradarDelayStatus), identisch zu den Bus-Markern.
// Die Sample-Delay-Werte (Sekunden) treffen jeweils die passende Farbschwelle
// (0 → grün, 120 → gelb „Bis 4 Min.", 300 → rot „Mehr als 4 Min.").
const DELAY_SCALE_STEPS = [
    { sampleDelay: 0, labelId: "busLegend.onTime" },
    { sampleDelay: 120, labelId: "busLegend.upTo4" },
    { sampleDelay: 300, labelId: "busLegend.late4plus" }
] as const;

const LEGEND_ICON_SIZE = 22;

function delayIconSrc(sampleDelay: number) {
    return getBusradarBusSvgDataUrl(getBusradarDelayStatus(sampleDelay).color);
}

/**
 * Verspätungslegende als kompaktes Overlay-Panel unten links in der Karte.
 *
 * - Eingeklappt: schmale horizontale Skala „Pünktlich → Verspätet" (dauerhaft sichtbar).
 * - Ausgeklappt: Klick auf die Leiste öffnet über `ToggleTip` (Chakra-`Popover`) eine
 *   ausführliche vertikale Legende direkt oberhalb der Leiste. `ToggleTip` übernimmt
 *   Toggle-Verhalten, Outside-Click, Escape, Fokusmanagement und Tastaturbedienung.
 *
 * Hintergrund, Border, Schatten und Text nutzen ausschließlich Chakra-/Trails-Semantic-Tokens
 * (light/dark-fähig); Delay-Farben und Bus-Icons stammen aus der zentralen Busradar-Konfiguration.
 */
export function BusradarLegend() {
    const intl = useIntl();
    const [isOpen, setIsOpen] = useState(false);
    // Zustandsabhängiger Hinweis für Button-aria-label und Chevron-Tooltip.
    const toggleHint = intl.formatMessage({
        id: isOpen ? "busLegend.collapseHint" : "busLegend.expandHint"
    });
    return (
        <ToggleTip
            open={isOpen}
            onOpenChange={(event) => setIsOpen(event.open)}
            positioning={{ placement: "top-start", sameWidth: true }}
            content={<BusradarLegendDetails />}
            contentProps={{
                bg: "bg",
                color: "fg",
                borderWidth: "1px",
                borderColor: "border",
                rounded: "md",
                boxShadow: "md",
                px: 3,
                py: 2
            }}
        >
            <chakra.button
                type="button"
                aria-label={toggleHint}
                display="inline-flex"
                alignItems="center"
                gap={2}
                width="fit-content"
                maxWidth="calc(100vw - 1rem)"
                bg="bg"
                color="fg.muted"
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                boxShadow="sm"
                px={2.5}
                py={1.5}
                fontSize="xs"
                fontWeight="bold"
                lineHeight="1"
                cursor="pointer"
                _hover={{ bg: "bg.muted" }}
                _focusVisible={{
                    outlineWidth: "2px",
                    outlineStyle: "solid",
                    outlineColor: "border.emphasized",
                    outlineOffset: "2px"
                }}
            >
                <Text as="span" whiteSpace="nowrap">
                    {intl.formatMessage({ id: "busLegend.onTime" })}
                </Text>
                <Flex align="center" gap={1} flexShrink={0}>
                    {DELAY_SCALE_STEPS.map((step) => {
                        const label = intl.formatMessage({ id: step.labelId });
                        return (
                            <Tooltip key={step.labelId} content={label}>
                                <Box
                                    as="span"
                                    role="img"
                                    aria-label={label}
                                    display="inline-flex"
                                    flexShrink={0}
                                >
                                    <img
                                        src={delayIconSrc(step.sampleDelay)}
                                        alt=""
                                        width={LEGEND_ICON_SIZE}
                                        height={LEGEND_ICON_SIZE}
                                    />
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Flex>
                <Text as="span" whiteSpace="nowrap">
                    {intl.formatMessage({ id: "busLegend.scaleEnd" })}
                </Text>
                <Tooltip content={toggleHint}>
                    <Box
                        as="span"
                        aria-hidden="true"
                        display="inline-flex"
                        alignItems="center"
                        flexShrink={0}
                        color="fg.muted"
                        transform={isOpen ? "rotate(0deg)" : "rotate(180deg)"}
                        transition="transform 150ms ease"
                    >
                        <LuChevronDown />
                    </Box>
                </Tooltip>
            </chakra.button>
        </ToggleTip>
    );
}

function BusradarLegendDetails() {
    const intl = useIntl();
    return (
        <Flex direction="column" gap={1.5} minWidth={0}>
            <Text fontSize="sm" fontWeight="semibold" color="fg">
                {intl.formatMessage({ id: "busLegend.title" })}
            </Text>
            {DELAY_SCALE_STEPS.map((step) => (
                <Flex key={step.labelId} align="center" gap={2}>
                    <Box as="span" display="inline-flex" flexShrink={0}>
                        <img
                            src={delayIconSrc(step.sampleDelay)}
                            alt=""
                            width={LEGEND_ICON_SIZE}
                            height={LEGEND_ICON_SIZE}
                        />
                    </Box>
                    <Text as="span" fontSize="xs" fontWeight="semibold" whiteSpace="nowrap">
                        {intl.formatMessage({ id: step.labelId })}
                    </Text>
                </Flex>
            ))}
        </Flex>
    );
}

export function BusradarLegendIcon(props: { color: string }) {
    return (
        <Box
            as="span"
            className="basis-opt-app__busradar-legend-icon"
            width="1.35rem"
            height="1.35rem"
            display="inline-flex"
            flexShrink={0}
        >
            <img src={getBusradarBusSvgDataUrl(props.color)} alt="" width="22" height="22" />
        </Box>
    );
}
