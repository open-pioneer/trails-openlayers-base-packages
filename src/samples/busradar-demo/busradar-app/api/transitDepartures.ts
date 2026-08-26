// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { buildStopDeparturesUrl } from "./busradarApi";

const DEPARTURE_CACHE_MAX_AGE_MS = 30_000;

export type TransitDeparture = {
    id: string;
    /** Trip-/Journey-Bezeichner (Busradar `fahrtbezeichner`) – identisch mit dem Live-Vehicle-Key. */
    tripId?: string;
    /** Haltestellen-ID der Abfahrt (Busradar `haltid`). */
    stopId?: string;
    /** Halt-Sequenz innerhalb der Fahrt (Busradar `sequenz`). */
    sequence?: number;
    line: string;
    destination: string;
    plannedDepartureTime?: number;
    realtimeDepartureTime?: number;
    /** Geplante Ankunftszeit an dieser Haltestelle (Busradar `ankunftszeit`). */
    plannedArrivalTime?: number;
    /** Prognostizierte Ankunftszeit an dieser Haltestelle (Busradar `tatsaechliche_ankunftszeit`). */
    realtimeArrivalTime?: number;
    delaySeconds?: number;
    occupancy?: string;
    isRealtime: boolean;
};

type RawDeparture = {
    fahrtbezeichner?: string;
    haltid?: string;
    sequenz?: number | string;
    linientext?: string;
    richtungstext?: string;
    abfahrtszeit?: number;
    tatsaechliche_abfahrtszeit?: number;
    ankunftszeit?: number;
    tatsaechliche_ankunftszeit?: number;
    delay?: number;
    prognosemoeglich?: string;
    besetztgrad?: string;
};

const departureCache = new Map<string, { loadedAt: number; departures: TransitDeparture[] }>();

export async function loadTransitDepartures(stopId: string, signal?: AbortSignal) {
    const cached = departureCache.get(stopId);
    if (cached && Date.now() - cached.loadedAt < DEPARTURE_CACHE_MAX_AGE_MS) {
        return cached.departures;
    }

    const response = await fetch(buildStopDeparturesUrl(stopId), { signal });
    if (!response.ok) {
        throw new Error(`Abfahrten konnten nicht geladen werden: ${response.status}`);
    }

    const rawDepartures = (await response.json()) as RawDeparture[];
    const departures = Array.isArray(rawDepartures)
        ? rawDepartures.map((departure, index) => normalizeDeparture(departure, index))
        : [];

    departureCache.set(stopId, { loadedAt: Date.now(), departures });
    return departures;
}

function normalizeDeparture(departure: RawDeparture, index: number): TransitDeparture {
    return {
        id: departure.fahrtbezeichner ?? `departure-${index}`,
        tripId: normalizeId(departure.fahrtbezeichner),
        stopId: normalizeId(departure.haltid),
        sequence: normalizeNumber(departure.sequenz),
        line: departure.linientext || "Bus",
        destination: departure.richtungstext || "Keine Angabe",
        plannedDepartureTime: normalizeTimestamp(departure.abfahrtszeit),
        realtimeDepartureTime: normalizeTimestamp(departure.tatsaechliche_abfahrtszeit),
        plannedArrivalTime: normalizeTimestamp(departure.ankunftszeit),
        realtimeArrivalTime: normalizeTimestamp(departure.tatsaechliche_ankunftszeit),
        delaySeconds: normalizeNumber(departure.delay),
        occupancy: normalizeOccupancy(departure.besetztgrad),
        isRealtime:
            departure.prognosemoeglich === "true" || departure.tatsaechliche_abfahrtszeit != null
    };
}

function normalizeId(value: unknown) {
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function normalizeTimestamp(value: unknown) {
    const timestamp = normalizeNumber(value);
    return timestamp == null ? undefined : timestamp;
}

function normalizeNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

function normalizeOccupancy(value: unknown) {
    if (typeof value !== "string" || !value || value === "Unbekannt") {
        return undefined;
    }
    return value;
}
