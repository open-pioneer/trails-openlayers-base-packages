// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { getDistance } from "ol/sphere";
import type { TransitStop } from "../api/transitStops";

/** Ein Treffer der Umkreissuche: Haltestelle plus geodätische Entfernung in Metern. */
export type NearestStopResult = {
    stop: TransitStop;
    distanceMeters: number;
};

/** Optionen für die Umkreissuche. */
export type FindNearestStopsOptions = {
    /** Maximaler Suchradius in Metern (inklusive). */
    maxRadiusMeters?: number;
    /** Maximale Anzahl zurückgegebener Treffer. */
    maxResults?: number;
};

const DEFAULT_MAX_RADIUS_METERS = 500;
const DEFAULT_MAX_RESULTS = 3;

/**
 * Ermittelt die nächstgelegenen Haltestellen zu einer Ausgangsposition.
 *
 * Ablauf (bewusst in dieser Reihenfolge, damit je Station der nächstgelegene Eintrag erhalten
 * bleibt): Distanz berechnen → nach Radius filtern → aufsteigend sortieren → deduplizieren →
 * auf `maxResults` begrenzen.
 *
 * Die Entfernung wird geodätisch in Metern über `ol/sphere` berechnet; Ausgangs- und
 * Haltestellenkoordinaten liegen als `[lon, lat]` (EPSG:4326) vor.
 *
 * Deduplication auf Stationsebene: Mehrere Bahnsteige derselben Station erscheinen nur einmal
 * (nächstgelegener Bahnsteig). Der Dedup-Schlüssel ist `parentStationId`, ersatzweise der
 * getrimmte, kleingeschriebene Name.
 */
export function findNearestStops(
    originLonLat: [number, number],
    stops: readonly TransitStop[],
    options?: FindNearestStopsOptions
): NearestStopResult[] {
    const maxRadiusMeters = options?.maxRadiusMeters ?? DEFAULT_MAX_RADIUS_METERS;
    const maxResults = options?.maxResults ?? DEFAULT_MAX_RESULTS;

    // 1. Distanz berechnen
    const withDistance: NearestStopResult[] = stops.map((stop) => ({
        stop,
        distanceMeters: getDistance(originLonLat, stop.lonLat)
    }));

    // 2. Nach Radius filtern (inklusive)
    const withinRadius = withDistance.filter((result) => result.distanceMeters <= maxRadiusMeters);

    // 3. Aufsteigend nach Entfernung sortieren
    withinRadius.sort((a, b) => a.distanceMeters - b.distanceMeters);

    // 4. Deduplizieren (Stationsebene) – der erste (= nächstgelegene) Eintrag je Station gewinnt
    const seenStationKeys = new Set<string>();
    const deduplicated: NearestStopResult[] = [];
    for (const result of withinRadius) {
        const key = getStationKey(result.stop);
        if (seenStationKeys.has(key)) {
            continue;
        }
        seenStationKeys.add(key);
        deduplicated.push(result);
    }

    // 5. Auf maximale Trefferzahl begrenzen
    return deduplicated.slice(0, maxResults);
}

/** Dedup-Schlüssel einer Haltestelle: bevorzugt Station-ID, sonst normalisierter Name. */
function getStationKey(stop: TransitStop): string {
    const stationId = stop.parentStationId?.trim();
    if (stationId) {
        return `id:${stationId}`;
    }
    return `name:${stop.name.trim().toLocaleLowerCase("de-DE")}`;
}
