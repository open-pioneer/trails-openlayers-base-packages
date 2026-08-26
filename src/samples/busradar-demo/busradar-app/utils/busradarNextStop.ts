// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { BusradarTripStop, BusradarTripStopsResult } from "../api/busradarTripDetails";

/**
 * Kleine Toleranz (Sekunden), innerhalb derer eine gerade vergangene Ankunftszeit noch angezeigt
 * werden darf, bevor sie als vergangen gilt. Verhindert Flackern bei leicht verspäteten Prognosen.
 */
const NEXT_STOP_PAST_GRACE_S = 30;

/** Eingabe für die Ermittlung der nächsten Haltestelle eines ausgewählten Live-Busses. */
export interface BusradarNextStopInput {
    /** Bereits geladene Trip-Stops der aktuellen Fahrt (zentrale Quelle, keine Parallellogik). */
    tripStops?: Pick<BusradarTripStopsResult, "stops">;
    /** Aktuell erreichte Halt-Sequenz des Fahrzeugs (`vehicle.properties.sequenz`). */
    vehicleSequence?: number;
    /**
     * Optionale, priorisierte Zielhaltestelle einer angeklickten Abfahrt. Wird bevorzugt angezeigt,
     * solange sie noch nicht passiert wurde; danach greift automatisch die allgemeine nächste
     * Haltestelle. `arrivalTime` ist nur ein Snapshot-Fallback (Epoch s), falls die Haltestelle
     * (noch) nicht in den Trip-Stops auflösbar ist.
     */
    focusedStop?: {
        stopId?: string;
        stopName?: string;
        stopSequence?: number;
        arrivalTime?: number;
        isRealtime?: boolean;
        delaySeconds?: number;
    };
}

/** Ergebnis: darzustellende nächste Haltestelle mit voraussichtlicher Ankunftszeit (Epoch s). */
export interface BusradarNextStopInfo {
    stopName?: string;
    arrivalTime?: number;
    isRealtime?: boolean;
    /** Haltbezogener Delay (Sekunden) dieser Haltestelle – Basis für den Popover-Delay-Chip. */
    delaySeconds?: number;
}

/**
 * Ermittelt die darzustellende „nächste Haltestelle" eines ausgewählten Live-Busses aus den bereits
 * geladenen Trip-Stops. Priorisiert die Zielhaltestelle einer angeklickten Abfahrt, solange sie noch
 * nicht passiert wurde, und fällt danach auf die allgemeine nächste Haltestelle (`isNext`) zurück.
 *
 * Zeitpräferenz: Realtime-Prognose (`predictedArrivalTime`) vor planmäßiger `arrivalTime`; niemals
 * eine Abfahrtszeit. Vergangene oder nicht bestimmbare Zeiten liefern `undefined` (Zeile ausblenden).
 */
export function resolveBusradarNextStop(
    input: BusradarNextStopInput,
    nowSeconds: number
): BusradarNextStopInfo | undefined {
    const stops = input.tripStops?.stops ?? [];
    const { focusedStop, vehicleSequence } = input;

    const focusedNotPassed =
        !!focusedStop &&
        (vehicleSequence == null ||
            focusedStop.stopSequence == null ||
            vehicleSequence < focusedStop.stopSequence);

    if (focusedNotPassed) {
        const matched = focusedStop.stopId
            ? stops.find((stop) => stop.stopId === focusedStop.stopId)
            : undefined;
        const matchedInfo = matched ? buildNextStopInfo(matched, nowSeconds) : undefined;
        if (matchedInfo) {
            return matchedInfo;
        }
        if (
            focusedStop.arrivalTime != null &&
            focusedStop.arrivalTime >= nowSeconds - NEXT_STOP_PAST_GRACE_S
        ) {
            return {
                stopName: focusedStop.stopName,
                arrivalTime: focusedStop.arrivalTime,
                isRealtime: !!focusedStop.isRealtime,
                delaySeconds: focusedStop.delaySeconds
            };
        }
        // Fokus-Haltestelle nicht auf eine zukünftige Zeit auflösbar → allgemeine nächste Haltestelle.
    }

    const nextStop = stops.find((stop) => stop.isNext);
    return nextStop ? buildNextStopInfo(nextStop, nowSeconds) : undefined;
}

function buildNextStopInfo(
    stop: BusradarTripStop,
    nowSeconds: number
): BusradarNextStopInfo | undefined {
    const predicted = stop.predictedArrivalTime;
    const arrivalTime = predicted ?? gtfsClockToEpochSeconds(stop.arrivalTime, nowSeconds);
    if (arrivalTime == null || arrivalTime < nowSeconds - NEXT_STOP_PAST_GRACE_S) {
        return undefined;
    }
    return {
        stopName: stop.stopName,
        arrivalTime,
        isRealtime: predicted != null,
        delaySeconds: stop.delay
    };
}

/**
 * Wandelt eine statische GTFS-Uhrzeit („HH:MM:SS", Stunden können ≥ 24 sein) in Epoch-Sekunden auf
 * Basis des lokalen Servicetags um. Liegt die berechnete Zeit deutlich vor „jetzt", wird sie auf den
 * Folgetag gerollt (Servicetag über Mitternacht).
 */
export function gtfsClockToEpochSeconds(
    clock: string | undefined,
    nowSeconds: number
): number | undefined {
    if (!clock) {
        return undefined;
    }
    const parts = clock.split(":");
    if (parts.length < 2) {
        return undefined;
    }
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = parts.length >= 3 ? Number(parts[2]) : 0;
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
        return undefined;
    }

    const now = new Date(nowSeconds * 1000);
    const candidate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        seconds
    );
    let epoch = Math.floor(candidate.getTime() / 1000);
    if (epoch < nowSeconds - 6 * 3600) {
        epoch += 24 * 3600;
    }
    return epoch;
}
