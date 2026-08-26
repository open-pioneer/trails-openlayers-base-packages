// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import { LuX } from "react-icons/lu";
import { getBusradarDelayStatus } from "../map/layers/busradarLayer";
import type { BusradarSelectionDetails } from "../types";
import { classifyBusradarDelay, selectBusradarPopupDelay } from "../utils/busradarDelay";
import { BusradarLegendIcon } from "./BusradarLegend";

export function BusradarInfoOverlay(props: {
    details: BusradarSelectionDetails;
    error?: string;
    onClose: () => void;
}) {
    const intl = useIntl();
    const { vehicle } = props.details;
    const routeProperties = props.details.routeSplit?.route.properties;
    const line = String(
        vehicle.properties.linientext ??
            routeProperties?.linientext ??
            intl.formatMessage({ id: "busInfo.fallbackLine" })
    );
    const direction = String(
        vehicle.properties.richtungstext ??
            routeProperties?.richtungstext ??
            intl.formatMessage({ id: "busInfo.fallbackDirection" })
    );
    // Delay-Chip bevorzugt den haltbezogenen Delay der aktuell angezeigten nächsten/fokussierten
    // Haltestelle (gleiche Basis wie „Ankunft {Halt}" und die angeklickte Abfahrtszeile); nur ohne
    // Halt-Delay fällt er auf den allgemeinen Fahrzeug- bzw. Routen-Delay zurück.
    const delayStatus = getBusradarDelayStatus(
        selectBusradarPopupDelay(
            props.details.nextStop?.delaySeconds,
            vehicle.properties.delay,
            routeProperties?.delay
        )
    );

    return (
        <Box className="basis-opt-app__busradar-popup" role="document">
            <Flex alignItems="flex-start" justifyContent="space-between" gap={2}>
                <Box minWidth={0} className="basis-opt-app__busradar-popup-main">
                    <Text className="basis-opt-app__busradar-popup-line">
                        {intl.formatMessage({ id: "busInfo.line" }, { line })}
                    </Text>
                    <Text className="basis-opt-app__busradar-popup-direction">
                        {intl.formatMessage({ id: "busInfo.direction" }, { direction })}
                    </Text>
                </Box>
                <IconButton
                    className="basis-opt-app__busradar-popup-close"
                    variant="ghost"
                    size="2xs"
                    aria-label={intl.formatMessage({ id: "busInfo.close" })}
                    onClick={props.onClose}
                >
                    <LuX />
                </IconButton>
            </Flex>
            <Box className="basis-opt-app__busradar-popup-status">
                <BusradarDelayInfo status={delayStatus} compact />
                {props.error && (
                    <Text className="basis-opt-app__busradar-popup-error">{props.error}</Text>
                )}
            </Box>
            {props.details.nextStop?.arrivalTime != null && props.details.nextStop.stopName && (
                <Box mt="0.35rem">
                    <Text
                        fontSize="0.72rem"
                        fontWeight="normal"
                        lineHeight="1.2"
                        color="fg.muted"
                        overflowWrap="anywhere"
                    >
                        {intl.formatMessage(
                            { id: "busInfo.nextStopArrival" },
                            {
                                stop: props.details.nextStop.stopName,
                                time: formatBusradarEtaTime(props.details.nextStop.arrivalTime)
                            }
                        )}
                    </Text>
                </Box>
            )}
        </Box>
    );
}

function formatBusradarEtaTime(timestampSeconds: number) {
    return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(
        new Date(timestampSeconds * 1000)
    );
}

export function BusradarDelayInfo(props: {
    status: ReturnType<typeof getBusradarDelayStatus>;
    compact?: boolean;
}) {
    const intl = useIntl();
    return (
        <Flex
            alignItems="center"
            gap={props.compact ? 1.25 : 1.5}
            className={props.compact ? "basis-opt-app__busradar-delay" : undefined}
            fontSize={props.compact ? undefined : "xs"}
        >
            <BusradarLegendIcon color={props.status.color} />
            <span>{getBusradarDelayLabel(intl, props.status)}</span>
        </Flex>
    );
}

// Lokalisiert das (in der Datenschicht deutschsprachige) Delay-Label anhand des numerischen
// Delay-Werts neu über die zentrale Klassifizierung, ohne die Busradar-Datenschicht an i18n zu
// koppeln und ohne die Toleranz-/Rundungslogik zu duplizieren.
function getBusradarDelayLabel(
    intl: ReturnType<typeof useIntl>,
    status: ReturnType<typeof getBusradarDelayStatus>
) {
    const classification = classifyBusradarDelay(status.delay);
    if (!classification) {
        return intl.formatMessage({ id: "busInfo.delayNoRealtime" });
    }
    if (classification.kind === "punctual") {
        return intl.formatMessage({ id: "busInfo.delayOnTime" });
    }
    return classification.kind === "early"
        ? intl.formatMessage({ id: "busInfo.delayEarlier" }, { minutes: classification.minutes })
        : intl.formatMessage({ id: "busInfo.delayLater" }, { minutes: classification.minutes });
}
