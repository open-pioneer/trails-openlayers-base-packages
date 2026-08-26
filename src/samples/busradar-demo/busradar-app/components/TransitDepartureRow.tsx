// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, chakra } from "@chakra-ui/react";
import { useIntl } from "open-pioneer:react-hooks";
import type { TransitDeparture } from "../api/transitDepartures";
import { classifyBusradarDelay } from "../utils/busradarDelay";
import { classifyOccupancy } from "../utils/occupancyUtils";

/**
 * Eine einzelne Abfahrtszeile (Zeit + Verspätung/Status, Linie, Ziel, optional Besetztgrad).
 *
 * Gemeinsame, wiederverwendbare Darstellung für das Karten-Popover
 * (`TransitStopDeparturesOverlay`) und das Accordion der Umkreissuche (`NearestStopsPanel`).
 * Zeit-, Verspätungs- und Besetztgrad-Formatierung liegen bewusst hier zentral, damit keine
 * parallele Parsing-/Formatierungslogik entsteht.
 *
 * Ist `onSelect` gesetzt, wird die Zeile ein echtes, tastaturbedienbares Button-Element: ein Klick
 * wählt den zugehörigen Live-Bus über dieselbe Auswahl-/Detaillogik wie ein Kartenklick.
 *
 * `selected` (die Fahrt entspricht dem aktuell ausgewählten Live-Bus) ist ein eigener, dauerhafter
 * Zustand über `aria-current` und den Akzent-Hintergrund – unabhängig vom flüchtigen `_hover`.
 */
export function TransitDepartureRow(props: {
    departure: TransitDeparture;
    selected?: boolean;
    onSelect?: (departure: TransitDeparture) => void;
}) {
    const intl = useIntl();
    const departureTime =
        props.departure.realtimeDepartureTime ?? props.departure.plannedDepartureTime;
    const delay = getTransitDelayText(
        intl,
        props.departure.delaySeconds,
        props.departure.isRealtime
    );
    const rowClassName = props.selected
        ? "basis-opt-app__transit-departure-row basis-opt-app__transit-departure-row--selected"
        : "basis-opt-app__transit-departure-row";

    const content = (
        <>
            <span className="basis-opt-app__transit-departure-time">
                {formatTransitDepartureTime(departureTime)}
                <span className={delay.className}>{delay.label}</span>
            </span>
            <span className="basis-opt-app__transit-departure-line">{props.departure.line}</span>
            <span className="basis-opt-app__transit-departure-main">
                <span className="basis-opt-app__transit-departure-destination">
                    {props.departure.destination}
                </span>
                {props.departure.occupancy && (
                    <span className="basis-opt-app__transit-departure-occupancy">
                        {getTransitOccupancyLabel(intl, props.departure.occupancy)}
                    </span>
                )}
            </span>
        </>
    );

    if (!props.onSelect) {
        return <li className={rowClassName}>{content}</li>;
    }

    const onSelect = props.onSelect;
    const ariaLabel = intl.formatMessage(
        { id: "transitStops.departureSelectAria" },
        {
            line: props.departure.line,
            destination: props.departure.destination,
            time: formatTransitDepartureTime(departureTime)
        }
    );

    return (
        <Box as="li" listStyleType="none">
            <chakra.button
                type="button"
                className={rowClassName}
                width="100%"
                textAlign="start"
                cursor="pointer"
                aria-current={props.selected ? "true" : undefined}
                _hover={{ bg: props.selected ? undefined : "bg.muted" }}
                _focusVisible={{ outline: "2px solid", outlineColor: "border.emphasized" }}
                aria-label={ariaLabel}
                onClick={() => onSelect(props.departure)}
            >
                {content}
            </chakra.button>
        </Box>
    );
}

function getTransitOccupancyLabel(intl: ReturnType<typeof useIntl>, occupancy: string) {
    const category = classifyOccupancy(occupancy);
    const messageId = category
        ? `transitStops.occupancy.${category}`
        : "transitStops.occupancy.generic";
    return intl.formatMessage({ id: messageId });
}

function formatTransitDepartureTime(timestampSeconds?: number) {
    if (!timestampSeconds) {
        return "--:--";
    }

    return new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(timestampSeconds * 1000));
}

function getTransitDelayText(
    intl: ReturnType<typeof useIntl>,
    delaySeconds?: number,
    isRealtime?: boolean
) {
    if (!isRealtime) {
        return {
            label: intl.formatMessage({ id: "transitStops.delayPlan" }),
            className: "basis-opt-app__transit-delay"
        };
    }

    const classification = classifyBusradarDelay(delaySeconds);
    if (!classification || classification.kind === "punctual") {
        return {
            label: intl.formatMessage({ id: "transitStops.delayOnTime" }),
            className: "basis-opt-app__transit-delay"
        };
    }

    if (classification.kind === "late") {
        return {
            label: intl.formatMessage(
                { id: "transitStops.delayLate" },
                { minutes: classification.minutes }
            ),
            className: "basis-opt-app__transit-delay basis-opt-app__transit-delay--late"
        };
    }

    return {
        label: intl.formatMessage(
            { id: "transitStops.delayEarly" },
            { minutes: classification.minutes }
        ),
        className: "basis-opt-app__transit-delay basis-opt-app__transit-delay--early"
    };
}
