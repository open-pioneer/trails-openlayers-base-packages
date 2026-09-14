// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { normalizeBusradarLine } from "../utils/busradarLineUtils";

export function BusradarLineFilter(props: {
    availableLines: string[];
    selectedLines: string[];
    onAddLine: (line: string) => void;
    onRemoveLine: (line: string) => void;
    onReset: () => void;
}) {
    const intl = useIntl();
    const selectedLineKeys = new Set(props.selectedLines.map(normalizeBusradarLine));
    const selectedCount = props.selectedLines.length;

    // Alle verfügbaren Linien plus aktuell ausgewählte, die vorübergehend nicht mehr geliefert
    // werden (bleiben abwählbar). Reihenfolge der verfügbaren Linien bleibt erhalten, Duplikate
    // werden anhand des normalisierten Schlüssels entfernt.
    const displayLines: string[] = [];
    const seenLineKeys = new Set<string>();
    for (const line of [...props.availableLines, ...props.selectedLines]) {
        const key = normalizeBusradarLine(line);
        if (!key || seenLineKeys.has(key)) {
            continue;
        }
        seenLineKeys.add(key);
        displayLines.push(line);
    }

    return (
        <Box mt={0} pt={0}>
            <Flex alignItems="center" justifyContent="space-between" gap={2} mb={1}>
                <Text fontSize="xs" fontWeight="semibold">
                    {intl.formatMessage({ id: "busFilter.title" })}
                </Text>
                {selectedCount > 0 && (
                    <Button variant="plain" size="xs" height="auto" px={0} onClick={props.onReset}>
                        {intl.formatMessage({ id: "busFilter.showAll" })}
                    </Button>
                )}
            </Flex>
            <Flex
                wrap="wrap"
                gap={1}
                mt={1}
                maxW="100%"
                maxH="min(14rem, 40vh)"
                overflowX="hidden"
                overflowY="auto"
            >
                {displayLines.map((line) => {
                    const isSelected = selectedLineKeys.has(normalizeBusradarLine(line));
                    return (
                        <Button
                            key={line}
                            variant={isSelected ? "solid" : "outline"}
                            size="xs"
                            minW="1.5rem"
                            h="1.5rem"
                            px={0}
                            borderRadius="full"
                            aria-pressed={isSelected}
                            aria-label={intl.formatMessage(
                                { id: "busFilter.toggleLine" },
                                { line }
                            )}
                            onClick={() =>
                                isSelected ? props.onRemoveLine(line) : props.onAddLine(line)
                            }
                        >
                            {line}
                        </Button>
                    );
                })}
            </Flex>
        </Box>
    );
}
