// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { strFromU8, unzipSync } from "fflate";
import gtfsStaticFeedUrl from "../data/stadtwerke_feed.zip?url";
import { BUSRADAR_STOPS_URL, buildStopDeparturesUrl } from "./busradarApi";

const GTFS_STATIC_FEED_URL = gtfsStaticFeedUrl;
const UPCOMING_STOP_COUNT = 5;
const PREDICTION_STOP_COUNT = 3;
const PREDICTION_CACHE_MAX_AGE_MS = 30_000;

export type BusradarTripStop = {
    stopId: string;
    stopSequence: number;
    stopName: string;
    arrivalTime: string;
    departureTime: string;
    predictedArrivalTime?: number;
    predictedDepartureTime?: number;
    delay?: number;
    isNext: boolean;
};

export type BusradarTripStopsResult = {
    tripId: string;
    stops: BusradarTripStop[];
    allStopIds: string[];
    startStopName?: string;
    endStopName?: string;
    hasStaticStopSequence: boolean;
    staticStopCount: number;
    predictionsAvailable: boolean;
    loadStats?: GtfsLoadStats;
};

type GtfsStopTime = {
    tripId: string;
    arrivalTime: string;
    departureTime: string;
    stopId: string;
    stopSequence: number;
};

type GtfsStop = {
    stopId: string;
    stopName: string;
};

type GtfsIndex = {
    stopTimesByTripId: Map<string, GtfsStopTime[]>;
    stopsById: Map<string, GtfsStop>;
    // Fahrtgeometrie-Fallback: unabhängig vom stop_times-/Haltestellen-Join. `trips.txt` liefert
    // die shape_id je GTFS-Trip, `shapes.txt` die zugehörige, nach shape_pt_sequence sortierte
    // Punktfolge (LonLat).
    shapeIdByTripId: Map<string, string>;
    shapePointsByShapeId: Map<string, [number, number][]>;
    loadStats: GtfsLoadStats;
};

type GtfsLoadStats = {
    zipBytes: number;
    stopTimesBytes: number;
    tripsBytes: number;
    stopsBytes: number;
    tripCount: number;
    stopTimeCount: number;
    stopCount: number;
    downloadMs: number;
    unzipMs: number;
    parseMs: number;
};

type StopDeparture = {
    fahrtbezeichner?: string;
    haltid?: string;
    delay?: number;
    tatsaechliche_ankunftszeit?: number;
    tatsaechliche_abfahrtszeit?: number;
};

type BusradarStopsFeatureCollection = {
    features?: BusradarStopFeature[];
};

type BusradarStopFeature = {
    properties?: {
        nr?: string | number;
        lbez?: string;
        global_id?: string;
    };
};

type BusradarStopIndex = {
    namesByStopId: Map<string, string>;
    namesByBaseId: Map<string, string>;
};

let gtfsIndexPromise: Promise<GtfsIndex> | undefined;
let gtfsIndex: GtfsIndex | undefined;
let busradarStopIndexPromise: Promise<BusradarStopIndex> | undefined;
let busradarStopIndex: BusradarStopIndex | undefined;
const predictionCache = new Map<string, { loadedAt: number; departure?: StopDeparture }>();

export async function loadBusradarTripStops(
    options: {
        fahrtbezeichner: string;
        fplId: string;
        currentSequence?: number;
    },
    signal?: AbortSignal
): Promise<BusradarTripStopsResult> {
    const [index, busradarStops] = await Promise.all([loadGtfsIndex(), loadBusradarStopIndex()]);
    throwIfAborted(signal);

    const tripId = getGtfsTripId(options.fplId, options.fahrtbezeichner);
    const stopTimes = index.stopTimesByTripId.get(tripId) ?? [];
    const hasStaticStopSequence = stopTimes.length > 0;
    const allStopIds = stopTimes.map((stopTime) => stopTime.stopId);
    const upcomingStopTimes = getUpcomingStopTimes(stopTimes, options.currentSequence);
    const predictionResults = await loadStopPredictions(
        upcomingStopTimes.slice(0, PREDICTION_STOP_COUNT),
        options.fahrtbezeichner,
        signal
    );

    let predictionsAvailable = false;
    const stops = upcomingStopTimes.map((stopTime, indexInList) => {
        const prediction = predictionResults.get(stopTime.stopId);
        if (prediction) {
            predictionsAvailable = true;
        }

        return {
            stopId: stopTime.stopId,
            stopSequence: stopTime.stopSequence,
            stopName:
                getStopName(index, busradarStops, stopTime.stopId) ?? "Unbekannte Haltestelle",
            arrivalTime: stopTime.arrivalTime,
            departureTime: stopTime.departureTime,
            predictedArrivalTime: prediction?.tatsaechliche_ankunftszeit,
            predictedDepartureTime: prediction?.tatsaechliche_abfahrtszeit,
            delay: prediction?.delay,
            isNext: indexInList === 0
        } satisfies BusradarTripStop;
    });

    return {
        tripId,
        stops,
        allStopIds,
        startStopName: getStopName(index, busradarStops, stopTimes[0]?.stopId),
        endStopName: getStopName(index, busradarStops, stopTimes[stopTimes.length - 1]?.stopId),
        hasStaticStopSequence,
        staticStopCount: stopTimes.length,
        predictionsAvailable,
        loadStats: index.loadStats
    };
}

/**
 * Rekonstruiert die Fahrtgeometrie aus dem lokalen GTFS-Feed, wenn der Busradar-Fahrtendpunkt
 * keine nutzbare Geometrie liefert. Nutzt ausschließlich den Shape-Index (`trips.txt` →
 * `shape_id`, `shapes.txt` → nach `shape_pt_sequence` sortierte Punkte) und ist damit unabhängig
 * vom stop_times-/Haltestellen-Join: Ein fehlender oder fehlgeschlagener Stop-Join verhindert die
 * Route nicht. Rückgabe ist eine LonLat-Punktfolge (`[lon, lat]`) oder `undefined`.
 */
export async function loadGtfsTripShapePath(
    fplId: string,
    fahrtbezeichner: string,
    signal?: AbortSignal
): Promise<[number, number][] | undefined> {
    const index = await loadGtfsIndex();
    throwIfAborted(signal);

    const tripId = getGtfsTripId(fplId, fahrtbezeichner);
    const shapeId = index.shapeIdByTripId.get(tripId);
    if (!shapeId) {
        return undefined;
    }

    const shapePoints = index.shapePointsByShapeId.get(shapeId);
    if (!shapePoints || shapePoints.length < 2) {
        return undefined;
    }

    return shapePoints;
}

export async function resolveBusradarStopNames(stopIds: string[], signal?: AbortSignal) {
    const stopIndex = await loadBusradarStopIndex();
    throwIfAborted(signal);

    const resolvedStopNames = new Map<string, string>();
    for (const stopId of stopIds) {
        const stopName = resolveBusradarStopName(stopIndex, stopId);
        if (stopName) {
            resolvedStopNames.set(stopId, stopName);
        }
    }

    return resolvedStopNames;
}

function getStopName(
    index: GtfsIndex,
    busradarStops: BusradarStopIndex,
    stopId?: string
): string | undefined {
    if (!stopId) {
        return undefined;
    }

    const busradarName = resolveBusradarStopName(busradarStops, stopId);
    if (busradarName) {
        return busradarName;
    }

    const gtfsName = index.stopsById.get(stopId)?.stopName;
    return gtfsName && !isTechnicalStopName(gtfsName) ? gtfsName : undefined;
}

function isTechnicalStopName(stopName: string) {
    return /^\d+$/.test(stopName.trim());
}

function resolveBusradarStopName(stopIndex: BusradarStopIndex, stopId: string) {
    return stopIndex.namesByStopId.get(stopId) ?? stopIndex.namesByBaseId.get(stopId);
}

function loadBusradarStopIndex() {
    if (busradarStopIndex) {
        return Promise.resolve(busradarStopIndex);
    }
    if (busradarStopIndexPromise) {
        return busradarStopIndexPromise;
    }

    busradarStopIndexPromise = fetch(BUSRADAR_STOPS_URL)
        .then(async (response) => {
            if (!response.ok) {
                return createEmptyBusradarStopIndex();
            }

            const collection = (await response.json()) as BusradarStopsFeatureCollection;
            const namesByStopId = new Map<string, string>();
            const baseIdCandidates = new Map<string, Set<string>>();
            for (const feature of collection.features ?? []) {
                const stopId = feature.properties?.nr;
                const stopName = feature.properties?.lbez;
                if (stopId != null && stopName) {
                    const normalizedStopId = String(stopId);
                    namesByStopId.set(normalizedStopId, stopName);

                    const baseId =
                        getBaseStopId(feature.properties?.global_id) ??
                        normalizedStopId.slice(0, 5);
                    if (baseId) {
                        const candidates = baseIdCandidates.get(baseId) ?? new Set<string>();
                        candidates.add(stopName);
                        baseIdCandidates.set(baseId, candidates);
                    }
                }
            }

            const namesByBaseId = new Map<string, string>();
            for (const [baseId, candidates] of baseIdCandidates) {
                if (candidates.size === 1) {
                    const stopName = candidates.values().next().value;
                    if (stopName) {
                        namesByBaseId.set(baseId, stopName);
                    }
                }
            }

            busradarStopIndex = { namesByStopId, namesByBaseId };
            return busradarStopIndex;
        })
        .catch(() => createEmptyBusradarStopIndex());

    return busradarStopIndexPromise;
}

function createEmptyBusradarStopIndex(): BusradarStopIndex {
    return { namesByStopId: new Map(), namesByBaseId: new Map() };
}

function getBaseStopId(globalId?: string) {
    const parts = globalId?.split(":");
    return parts && parts.length >= 3 ? parts[2] : undefined;
}

function loadGtfsIndex() {
    if (gtfsIndex) {
        return Promise.resolve(gtfsIndex);
    }
    if (gtfsIndexPromise) {
        return gtfsIndexPromise;
    }

    gtfsIndexPromise = loadAndParseGtfsIndex()
        .then((index) => {
            gtfsIndex = index;
            return index;
        })
        .catch((error) => {
            // Fehlgeschlagene GTFS-Ladeversuche nicht dauerhaft cachen, damit ein späterer
            // Aufruf nach einem transienten Fehler erneut laden kann.
            gtfsIndexPromise = undefined;
            throw error instanceof Error
                ? error
                : new Error("GTFS-Feed konnte nicht geladen werden.");
        });

    return gtfsIndexPromise;
}

async function loadAndParseGtfsIndex(): Promise<GtfsIndex> {
    const downloadStartedAt = performance.now();
    const response = await fetch(GTFS_STATIC_FEED_URL);
    if (!response.ok) {
        throw new Error(`GTFS-Feed konnte nicht geladen werden: ${response.status}`);
    }

    const zipBytes = new Uint8Array(await response.arrayBuffer());
    const unzipStartedAt = performance.now();
    const zipEntries = unzipSync(zipBytes, {
        filter: (file) =>
            ["trips.txt", "stop_times.txt", "stops.txt", "shapes.txt"].includes(file.name)
    });
    const parseStartedAt = performance.now();

    const tripsBytes = zipEntries["trips.txt"];
    const stopTimesBytes = zipEntries["stop_times.txt"];
    const stopsBytes = zipEntries["stops.txt"];
    if (!tripsBytes || !stopTimesBytes || !stopsBytes) {
        throw new Error("GTFS-Feed ist unvollständig.");
    }

    const stopsById = parseStops(strFromU8(stopsBytes));
    const stopTimesByTripId = parseStopTimes(strFromU8(stopTimesBytes));
    const tripsText = strFromU8(tripsBytes);
    const shapeIdByTripId = parseTripShapeIds(tripsText);
    // shapes.txt ist optional: Fehlt es, bleibt der Shape-Index leer und der Route-Fallback
    // liefert schlicht keine Geometrie, ohne den restlichen GTFS-Ablauf zu beeinträchtigen.
    const shapesBytes = zipEntries["shapes.txt"];
    const shapePointsByShapeId = shapesBytes
        ? parseShapePoints(strFromU8(shapesBytes))
        : new Map<string, [number, number][]>();
    const tripCount = countDataRows(tripsText);
    const parseFinishedAt = performance.now();

    return {
        stopsById,
        stopTimesByTripId,
        shapeIdByTripId,
        shapePointsByShapeId,
        loadStats: {
            zipBytes: zipBytes.length,
            stopTimesBytes: stopTimesBytes.length,
            tripsBytes: tripsBytes.length,
            stopsBytes: stopsBytes.length,
            tripCount,
            stopTimeCount: Array.from(stopTimesByTripId.values()).reduce(
                (sum, stopTimes) => sum + stopTimes.length,
                0
            ),
            stopCount: stopsById.size,
            downloadMs: Math.round(unzipStartedAt - downloadStartedAt),
            unzipMs: Math.round(parseStartedAt - unzipStartedAt),
            parseMs: Math.round(parseFinishedAt - parseStartedAt)
        }
    };
}

function parseStops(text: string) {
    const stopsById = new Map<string, GtfsStop>();
    forEachCsvDataRow(text, (columns) => {
        const stopId = columns[0];
        const stopName = columns[2];
        if (stopId && stopName) {
            stopsById.set(stopId, { stopId, stopName });
        }
    });
    return stopsById;
}

function parseStopTimes(text: string) {
    const stopTimesByTripId = new Map<string, GtfsStopTime[]>();
    forEachCsvDataRow(text, (columns) => {
        const tripId = columns[0];
        const arrivalTime = columns[1];
        const departureTime = columns[2];
        const stopId = columns[3];
        const stopSequence = Number(columns[4]);
        if (
            !tripId ||
            !arrivalTime ||
            !departureTime ||
            !stopId ||
            !Number.isFinite(stopSequence)
        ) {
            return;
        }

        const stopTimes = stopTimesByTripId.get(tripId) ?? [];
        stopTimes.push({ tripId, arrivalTime, departureTime, stopId, stopSequence });
        stopTimesByTripId.set(tripId, stopTimes);
    });

    for (const stopTimes of stopTimesByTripId.values()) {
        stopTimes.sort((first, second) => first.stopSequence - second.stopSequence);
    }

    return stopTimesByTripId;
}

// Baut aus der Header-Zeile eine Zuordnung Spaltenname → Spaltenindex. GTFS garantiert keine feste
// Spaltenreihenfolge in trips.txt/shapes.txt, daher wird spaltenname-basiert statt positionsbasiert
// gelesen.
function parseCsvHeaderIndex(headerLine: string) {
    const header = new Map<string, number>();
    parseCsvLine(headerLine).forEach((columnName, index) => {
        header.set(columnName.trim(), index);
    });
    return header;
}

function parseTripShapeIds(text: string) {
    const shapeIdByTripId = new Map<string, string>();
    const lines = text.split(/\r?\n/);
    const header = parseCsvHeaderIndex(lines[0] ?? "");
    const tripIdColumn = header.get("trip_id");
    const shapeIdColumn = header.get("shape_id");
    if (tripIdColumn === undefined || shapeIdColumn === undefined) {
        return shapeIdByTripId;
    }

    for (let index = 1; index < lines.length; index++) {
        const line = lines[index];
        if (!line) {
            continue;
        }
        const columns = parseCsvLine(line);
        const tripId = columns[tripIdColumn];
        const shapeId = columns[shapeIdColumn];
        if (tripId && shapeId) {
            shapeIdByTripId.set(tripId, shapeId);
        }
    }

    return shapeIdByTripId;
}

function parseShapePoints(text: string) {
    const pointsByShapeId = new Map<string, { sequence: number; lonLat: [number, number] }[]>();
    const lines = text.split(/\r?\n/);
    const header = parseCsvHeaderIndex(lines[0] ?? "");
    const shapeIdColumn = header.get("shape_id");
    const latColumn = header.get("shape_pt_lat");
    const lonColumn = header.get("shape_pt_lon");
    const sequenceColumn = header.get("shape_pt_sequence");
    if (
        shapeIdColumn === undefined ||
        latColumn === undefined ||
        lonColumn === undefined ||
        sequenceColumn === undefined
    ) {
        return new Map<string, [number, number][]>();
    }

    for (let index = 1; index < lines.length; index++) {
        const line = lines[index];
        if (!line) {
            continue;
        }
        const columns = parseCsvLine(line);
        const shapeId = columns[shapeIdColumn];
        const latitude = Number(columns[latColumn]);
        const longitude = Number(columns[lonColumn]);
        const sequence = Number(columns[sequenceColumn]);
        if (
            !shapeId ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            !Number.isFinite(sequence)
        ) {
            continue;
        }

        const points = pointsByShapeId.get(shapeId) ?? [];
        // GeoJSON-/OpenLayers-Konvention [lon, lat], damit die Punktfolge wie die API-Geometrie
        // weiterverarbeitet werden kann.
        points.push({ sequence, lonLat: [longitude, latitude] });
        pointsByShapeId.set(shapeId, points);
    }

    const sortedByShapeId = new Map<string, [number, number][]>();
    for (const [shapeId, points] of pointsByShapeId) {
        points.sort((first, second) => first.sequence - second.sequence);
        sortedByShapeId.set(
            shapeId,
            points.map((point) => point.lonLat)
        );
    }

    return sortedByShapeId;
}

function getUpcomingStopTimes(stopTimes: GtfsStopTime[], currentSequence?: number) {
    if (!Number.isFinite(currentSequence)) {
        return stopTimes.slice(0, UPCOMING_STOP_COUNT);
    }

    // Busradar's `sequenz` matched the currently reached stop_sequence in observed data;
    // the next stop is therefore the first GTFS stop with a larger sequence.
    return stopTimes
        .filter((stopTime) => stopTime.stopSequence > Number(currentSequence))
        .slice(0, UPCOMING_STOP_COUNT);
}

async function loadStopPredictions(
    stopTimes: GtfsStopTime[],
    fahrtbezeichner: string,
    signal?: AbortSignal
) {
    const predictions = new Map<string, StopDeparture>();
    await Promise.all(
        stopTimes.map(async (stopTime) => {
            const prediction = await loadStopPrediction(stopTime.stopId, fahrtbezeichner, signal);
            if (prediction) {
                predictions.set(stopTime.stopId, prediction);
            }
        })
    );
    return predictions;
}

async function loadStopPrediction(stopId: string, fahrtbezeichner: string, signal?: AbortSignal) {
    const cacheKey = `${stopId}:${fahrtbezeichner}`;
    const cached = predictionCache.get(cacheKey);
    if (cached && Date.now() - cached.loadedAt < PREDICTION_CACHE_MAX_AGE_MS) {
        return cached.departure;
    }

    try {
        const response = await fetch(buildStopDeparturesUrl(stopId), { signal });
        if (!response.ok) {
            return undefined;
        }

        const departures = (await response.json()) as StopDeparture[];
        const departure = Array.isArray(departures)
            ? departures.find((candidate) => candidate.fahrtbezeichner === fahrtbezeichner)
            : undefined;
        predictionCache.set(cacheKey, { loadedAt: Date.now(), departure });
        return departure;
    } catch (error) {
        if ((error as Error).name === "AbortError") {
            throw error;
        }
        return undefined;
    }
}

function getGtfsTripId(fplId: string, fahrtbezeichner: string) {
    const suffixStart = fahrtbezeichner.indexOf("_");
    const suffix = suffixStart >= 0 ? fahrtbezeichner.slice(suffixStart + 1) : fahrtbezeichner;
    return `${fplId}_${suffix}`;
}

function forEachCsvDataRow(text: string, callback: (columns: string[]) => void) {
    const lines = text.split(/\r?\n/);
    for (let index = 1; index < lines.length; index++) {
        const line = lines[index];
        if (line) {
            callback(parseCsvLine(line));
        }
    }
}

function countDataRows(text: string) {
    let count = 0;
    forEachCsvDataRow(text, () => {
        count++;
    });
    return count;
}

function parseCsvLine(line: string) {
    const values: string[] = [];
    let value = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];
        const nextChar = line[index + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                value += '"';
                index++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            values.push(value);
            value = "";
        } else {
            value += char;
        }
    }

    values.push(value);
    return values;
}

function throwIfAborted(signal?: AbortSignal) {
    if (signal?.aborted) {
        throw new DOMException("Request aborted", "AbortError");
    }
}
