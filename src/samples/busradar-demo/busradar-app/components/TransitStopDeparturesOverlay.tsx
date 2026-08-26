// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { LuX } from "react-icons/lu";
import type { TransitDeparture } from "../api/transitDepartures";
import { useDepartureBusSelect } from "../hooks/useDepartureBusSelect";
import type { BusradarDepartureSelectionStatus } from "../hooks/useBusradarSelection";
import { useNowSeconds } from "../hooks/useNowSeconds";
import type { TransitStopSummary } from "../types";
import { filterUpcomingDepartures } from "../utils/transitDepartures";
import { TransitDepartureRow } from "./TransitDepartureRow";

export function TransitStopDeparturesOverlay(props: {
    summary: TransitStopSummary;
    departures?: TransitDeparture[];
    selectedBusLine?: unknown;
    selectedTripId?: string;
    loading?: boolean;
    error?: string;
    onClose: () => void;
    onSelectDeparture?: (
        departure: TransitDeparture,
        stopName: string
    ) => BusradarDepartureSelectionStatus;
}) {
    const intl = useIntl();
    const { selectDeparture, notFoundDepartureId } = useDepartureBusSelect(
        props.onSelectDeparture,
        props.summary.name
    );
    const subtitle = props.summary.platform
        ? intl.formatMessage({ id: "transitStops.platform" }, { platform: props.summary.platform })
        : "";
    const selectedLine = normalizeTransitLineValue(props.selectedBusLine);
    const hasSelectedLineFilter = !!selectedLine;
    const nowSeconds = useNowSeconds();
    const upcomingDepartures = props.departures
        ? filterUpcomingDepartures(props.departures, nowSeconds)
        : undefined;
    const visibleDepartures = hasSelectedLineFilter
        ? upcomingDepartures?.filter(
              (departure) => normalizeTransitLineValue(departure.line) === selectedLine
          )
        : upcomingDepartures;
    const displayedDepartures = visibleDepartures?.slice(0, 12);

    return (
        <Box className="basis-opt-app__transit-popup" role="document">
            <Flex alignItems="flex-start" justifyContent="space-between" gap={2}>
                <Box minWidth={0}>
                    <Text className="basis-opt-app__transit-popup-title">{props.summary.name}</Text>
                    {subtitle && (
                        <Text className="basis-opt-app__transit-popup-subtitle">{subtitle}</Text>
                    )}
                </Box>
                <IconButton
                    className="basis-opt-app__transit-popup-close"
                    variant="ghost"
                    size="2xs"
                    aria-label={intl.formatMessage({ id: "transitStops.close" })}
                    onClick={props.onClose}
                >
                    <LuX />
                </IconButton>
            </Flex>
            <Box className="basis-opt-app__transit-popup-body">
                {props.loading && (
                    <Text className="basis-opt-app__transit-popup-note">
                        {intl.formatMessage({ id: "transitStops.loading" })}
                    </Text>
                )}
                {props.error && (
                    <Text className="basis-opt-app__transit-popup-error">{props.error}</Text>
                )}
                {!props.loading && !props.error && visibleDepartures?.length === 0 && (
                    <Text className="basis-opt-app__transit-popup-note">
                        {hasSelectedLineFilter
                            ? intl.formatMessage({ id: "transitStops.emptyFiltered" })
                            : intl.formatMessage({ id: "transitStops.emptyAll" })}
                    </Text>
                )}
                {displayedDepartures && displayedDepartures.length > 0 && (
                    <Box className="basis-opt-app__transit-departures" as="ol">
                        {displayedDepartures.map((departure) => (
                            <TransitDepartureRow
                                key={departure.id}
                                departure={departure}
                                selected={
                                    !!props.selectedTripId &&
                                    departure.tripId === props.selectedTripId
                                }
                                onSelect={selectDeparture}
                            />
                        ))}
                    </Box>
                )}
                {notFoundDepartureId && (
                    <Text className="basis-opt-app__transit-popup-note" mt="0.4rem">
                        {intl.formatMessage({ id: "transitStops.busNotFound" })}
                    </Text>
                )}
            </Box>
        </Box>
    );
}

export function normalizeTransitLineValue(value: unknown) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}
