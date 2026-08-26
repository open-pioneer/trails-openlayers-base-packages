// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BUSRADAR_STOPS_URL } from "./busradarApi";

export type TransitStop = {
    stopId: string;
    parentStationId?: string;
    name: string;
    shortName?: string;
    platform?: string;
    direction?: string;
    lonLat: [number, number];
};

type BusradarStopsFeatureCollection = {
    features?: BusradarStopFeature[];
};

type BusradarStopFeature = {
    geometry?: {
        type?: string;
        coordinates?: [number, number];
    };
    properties?: {
        nr?: string | number;
        lbez?: string;
        kbez?: string;
        richtung?: string;
        global_id?: string;
    };
};

let transitStopsPromise: Promise<TransitStop[]> | undefined;

export function loadTransitStops(signal?: AbortSignal) {
    if (!transitStopsPromise) {
        transitStopsPromise = loadAndParseTransitStops();
        // Fehlgeschlagene Ladeversuche nicht dauerhaft cachen, damit der nächste Aufruf
        // (z. B. nach einem transienten API-Fehler) erneut laden kann.
        transitStopsPromise.catch(() => {
            transitStopsPromise = undefined;
        });
    }

    if (!signal) {
        return transitStopsPromise;
    }

    return Promise.race([
        transitStopsPromise,
        new Promise<never>((_, reject) => {
            if (signal.aborted) {
                reject(createAbortError());
                return;
            }

            signal.addEventListener("abort", () => reject(createAbortError()), { once: true });
        })
    ]);
}

async function loadAndParseTransitStops() {
    const response = await fetch(BUSRADAR_STOPS_URL);
    if (!response.ok) {
        throw new Error(`Haltestellen konnten nicht geladen werden: ${response.status}`);
    }

    const collection = (await response.json()) as BusradarStopsFeatureCollection;
    return parseTransitStops(collection);
}

function parseTransitStops(collection: BusradarStopsFeatureCollection) {
    const stops: TransitStop[] = [];
    for (const feature of collection.features ?? []) {
        const stopId = feature.properties?.nr;
        const name = feature.properties?.lbez;
        const coordinates = feature.geometry?.coordinates;
        if (
            stopId == null ||
            !name ||
            feature.geometry?.type !== "Point" ||
            !Array.isArray(coordinates) ||
            coordinates.length < 2 ||
            !Number.isFinite(coordinates[0]) ||
            !Number.isFinite(coordinates[1])
        ) {
            continue;
        }

        const normalizedStopId = String(stopId);
        stops.push({
            stopId: normalizedStopId,
            parentStationId: getBaseStopId(feature.properties?.global_id),
            name,
            shortName: feature.properties?.kbez,
            platform: getPlatform(feature.properties?.global_id, normalizedStopId),
            direction: feature.properties?.richtung,
            lonLat: [coordinates[0], coordinates[1]]
        });
    }

    return stops;
}

function getBaseStopId(globalId?: string) {
    const parts = globalId?.split(":");
    return parts && parts.length >= 3 ? parts[2] : undefined;
}

function getPlatform(globalId: string | undefined, stopId: string) {
    const parts = globalId?.split(":");
    const platform = parts && parts.length >= 5 ? parts[4] : undefined;
    return platform || stopId.slice(-2) || undefined;
}

function createAbortError() {
    return new DOMException("Der Haltestellenabruf wurde abgebrochen.", "AbortError");
}
