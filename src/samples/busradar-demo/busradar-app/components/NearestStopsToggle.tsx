// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, chakra, Flex, Text } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets/tooltip";
import { LuMapPin } from "react-icons/lu";

/**
 * Kompakter, flacher Toggle für die Umkreissuche „Nächste Haltestellen" – optisch als
 * Legenden-/Toolbar-Eintrag gestaltet (gleiche Höhe/Optik wie die eingeklappte Live-Bus-Legende),
 * platziert neben der Legende unten links in der Karte.
 *
 * Reiner Toggle-Button (ein Klick aktiviert/deaktiviert die Umkreissuche); der komplette
 * Panel-/Kartenklick-/Auswahl-Workflow liegt unverändert in `useNearestStops`.
 *
 * Farben aus der `trails`-`colorPalette` wie die Busfilter-Linien-Buttons; Aktiv-/Inaktiv-Zustand
 * ausschließlich über Semantic Tokens (light/dark-fähig), ohne hartkodierte Farben.
 */
export function NearestStopsToggle(props: {
    active: boolean;
    label: string;
    onToggle: () => void;
}) {
    return (
        <Flex
            colorPalette="trails"
            align="center"
            width="fit-content"
            maxWidth="calc(100vw - 1rem)"
            bg={props.active ? "colorPalette.solid" : "bg"}
            color={props.active ? "colorPalette.contrast" : "colorPalette.fg"}
            borderWidth="1px"
            borderColor="colorPalette.solid"
            borderRadius="md"
            boxShadow="sm"
            px={2}
            py={1.0}
            transition="background-color 120ms ease, border-color 120ms ease, color 120ms ease"
        >
            <Tooltip content={props.label}>
                <chakra.button
                    type="button"
                    aria-label={props.label}
                    aria-pressed={props.active}
                    onClick={props.onToggle}
                    display="inline-flex"
                    alignItems="center"
                    gap={1.5}
                    bg="transparent"
                    color="inherit"
                    border={0}
                    borderRadius="sm"
                    px={0.5}
                    py={0.5}
                    fontSize="xs"
                    fontWeight="bold"
                    lineHeight="1"
                    cursor="pointer"
                    _hover={{ bg: props.active ? "transparent" : "colorPalette.subtle" }}
                    _focusVisible={{
                        outlineWidth: "2px",
                        outlineStyle: "solid",
                        outlineColor: "colorPalette.focusRing",
                        outlineOffset: "2px"
                    }}
                >
                    <Box
                        asChild
                        flexShrink={0}
                        aria-hidden="true"
                        display="inline-flex"
                        boxSize="15px"
                    >
                        <LuMapPin />
                    </Box>
                    <Text as="span" whiteSpace="nowrap">
                        {props.label}
                    </Text>
                </chakra.button>
            </Tooltip>
        </Flex>
    );
}
