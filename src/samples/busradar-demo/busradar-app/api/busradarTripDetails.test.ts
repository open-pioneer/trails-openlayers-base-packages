// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FPL_ID = "10100006";
const FAHRTBEZEICHNER = "250826_100180_8_9_485";
const GTFS_TRIP_ID = "10100006_100180_8_9_485";
// Fahrt, die zwar eine GTFS-Shape besitzt, aber bewusst nicht in stop_times.txt auftaucht: belegt,
// dass der Shape-Fallback unabhängig vom stop_times-/Haltestellen-Join funktioniert.
const SHAPE_ONLY_FAHRTBEZEICHNER = "250826_999999_1_1_1";

async function importTripDetails() {
    return await import("./busradarTripDetails");
}

function jsonResponse(data: unknown): Response {
    return { ok: true, status: 200, json: async () => data } as unknown as Response;
}

function binaryResponse(data: Uint8Array): Response {
    const bytes = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    return {
        ok: true,
        status: 200,
        arrayBuffer: async () => bytes
    } as unknown as Response;
}

function createGtfsFixture() {
    return zipSync({
        "trips.txt": strToU8(
            [
                "route_id,service_id,trip_id,shape_id",
                `route,service,${GTFS_TRIP_ID},main-shape`,
                "route,service,10100006_999999_1_1_1,shape-only"
            ].join("\n")
        ),
        "stop_times.txt": strToU8(
            [
                "trip_id,arrival_time,departure_time,stop_id,stop_sequence",
                `${GTFS_TRIP_ID},12:00:00,12:00:30,stop-1,1`,
                `${GTFS_TRIP_ID},12:05:00,12:05:30,stop-2,2`,
                `${GTFS_TRIP_ID},12:10:00,12:10:30,stop-3,3`
            ].join("\n")
        ),
        "stops.txt": strToU8(
            [
                "stop_id,stop_code,stop_name",
                "stop-1,,Erster Halt",
                "stop-2,,Zweiter Halt",
                "stop-3,,Dritter Halt"
            ].join("\n")
        ),
        // shape_pt_sequence bewusst unsortiert, um die Sortierung zu prüfen.
        "shapes.txt": strToU8(
            [
                "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence",
                "main-shape,51.91,7.62,2",
                "main-shape,51.9,7.6,1",
                "main-shape,51.92,7.64,3",
                "shape-only,51.8,7.5,1",
                "shape-only,51.81,7.52,2"
            ].join("\n")
        )
    });
}

function stubTripDetailsFetch() {
    const gtfsFixture = createGtfsFixture();
    vi.stubGlobal(
        "fetch",
        vi.fn((input: string | URL | Request) => {
            const url = String(input);
            if (url.includes("/haltestellen/") && url.includes("/abfahrten")) {
                return Promise.resolve(jsonResponse([]));
            }
            if (url.endsWith("/haltestellen")) {
                return Promise.resolve(jsonResponse({ features: [] }));
            }
            return Promise.resolve(binaryResponse(gtfsFixture));
        })
    );
}

beforeEach(() => {
    vi.resetModules();
    stubTripDetailsFetch();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("loadBusradarTripStops", () => {
    it("bildet die GTFS-Trip-ID und bestimmt Stopfolge sowie nächsten Halt", async () => {
        const { loadBusradarTripStops } = await importTripDetails();

        const result = await loadBusradarTripStops({
            fahrtbezeichner: FAHRTBEZEICHNER,
            fplId: FPL_ID,
            currentSequence: 1
        });

        expect(result.tripId).toBe(GTFS_TRIP_ID);
        expect(result.allStopIds).toEqual(["stop-1", "stop-2", "stop-3"]);
        expect(result.hasStaticStopSequence).toBe(true);
        expect(result.stops.map((stop) => [stop.stopId, stop.isNext])).toEqual([
            ["stop-2", true],
            ["stop-3", false]
        ]);
    });

    it("liefert für einen unbekannten Trip keine irreführende Stopfolge", async () => {
        const { loadBusradarTripStops } = await importTripDetails();

        const result = await loadBusradarTripStops({
            fahrtbezeichner: "250826_unbekannt",
            fplId: FPL_ID,
            currentSequence: 1
        });

        expect(result.tripId).toBe("10100006_unbekannt");
        expect(result.allStopIds).toEqual([]);
        expect(result.stops).toEqual([]);
        expect(result.hasStaticStopSequence).toBe(false);
    });
});

describe("loadGtfsTripShapePath", () => {
    it("liefert die nach shape_pt_sequence sortierte Shape-Punktfolge (LonLat)", async () => {
        const { loadGtfsTripShapePath } = await importTripDetails();

        const path = await loadGtfsTripShapePath(FPL_ID, FAHRTBEZEICHNER);

        expect(path).toEqual([
            [7.6, 51.9],
            [7.62, 51.91],
            [7.64, 51.92]
        ]);
    });

    it("funktioniert unabhängig vom stop_times-/Haltestellen-Join", async () => {
        const { loadBusradarTripStops, loadGtfsTripShapePath } = await importTripDetails();

        // Der Trip fehlt bewusst in stop_times.txt: Der Stop-Join liefert nichts …
        const stops = await loadBusradarTripStops({
            fahrtbezeichner: SHAPE_ONLY_FAHRTBEZEICHNER,
            fplId: FPL_ID,
            currentSequence: 1
        });
        expect(stops.allStopIds).toEqual([]);
        expect(stops.hasStaticStopSequence).toBe(false);

        // … die Shape-Geometrie bleibt trotzdem verfügbar.
        const path = await loadGtfsTripShapePath(FPL_ID, SHAPE_ONLY_FAHRTBEZEICHNER);
        expect(path).toEqual([
            [7.5, 51.8],
            [7.52, 51.81]
        ]);
    });

    it("liefert undefined ohne passende shape_id", async () => {
        const { loadGtfsTripShapePath } = await importTripDetails();

        const path = await loadGtfsTripShapePath(FPL_ID, "250826_ohne_shape");

        expect(path).toBeUndefined();
    });
});
