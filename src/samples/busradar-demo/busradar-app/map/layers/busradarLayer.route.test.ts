// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// GTFS-Shape-Fallback isolieren: der Route-Ladepfad wird ohne echtes GTFS-Zip getestet.
vi.mock("../../api/busradarTripDetails", () => ({
    loadGtfsTripShapePath: vi.fn()
}));

import { loadGtfsTripShapePath } from "../../api/busradarTripDetails";
import {
    BUSRADAR_CONTROLLER_PROPERTY,
    createBusradarLayer,
    type BusradarControllerApi
} from "./busradarLayer";
import { renderBusradarRoute } from "./busradarRouteLayer";

const FAHRTBEZEICHNER = "260826_100146_6_9_485";
const FPL_ID = "10100007";
// Cooldown aus busradarLayer.ts (TRIP_ROUTE_RETRY_TTL_MS); hier bewusst hart gehalten, um keine
// zusätzliche Test-Export-Oberfläche einzuführen.
const RETRY_TTL_MS = 60_000;

const API_LINESTRING: [number, number][] = [
    [7.61, 51.95],
    [7.612, 51.951],
    [7.614, 51.952],
    [7.616, 51.953]
];

const GTFS_SHAPE: [number, number][] = [
    [7.6, 51.9],
    [7.602, 51.901],
    [7.604, 51.902],
    [7.606, 51.903]
];

function createController(): BusradarControllerApi {
    const layer = createBusradarLayer();
    return layer.get(BUSRADAR_CONTROLLER_PROPERTY) as BusradarControllerApi;
}

function lineStringResponse(): Response {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            geometry: { type: "LineString", coordinates: API_LINESTRING },
            properties: { fahrtbezeichner: FAHRTBEZEICHNER, fpl_id: FPL_ID, linientext: "9" }
        })
    } as unknown as Response;
}

function nullGeometryResponse(): Response {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            geometry: null,
            properties: { fahrtbezeichner: FAHRTBEZEICHNER, fpl_id: FPL_ID, linientext: "9" }
        })
    } as unknown as Response;
}

beforeEach(() => {
    vi.mocked(loadGtfsTripShapePath).mockReset();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("Busradar-Route: Primärquelle und GTFS-Fallback", () => {
    it("nutzt die API-LineString-Geometrie als Primärquelle (kein GTFS-Fallback)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(lineStringResponse()));
        const api = createController();

        const route = await api.getTripRoute(FAHRTBEZEICHNER);

        expect(route?.lonLatCoordinates).toEqual(API_LINESTRING);
        expect(loadGtfsTripShapePath).not.toHaveBeenCalled();
    });

    it("rekonstruiert die Route aus GTFS, wenn die API-Geometrie fehlt (geometry: null)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nullGeometryResponse()));
        vi.mocked(loadGtfsTripShapePath).mockResolvedValue(GTFS_SHAPE);
        const api = createController();

        const route = await api.getTripRoute(FAHRTBEZEICHNER);

        expect(loadGtfsTripShapePath).toHaveBeenCalledWith(FPL_ID, FAHRTBEZEICHNER);
        expect(route?.lonLatCoordinates).toEqual(GTFS_SHAPE);
    });

    it("bewahrt die Busradar-Properties inkl. fpl_id in der GTFS-Fallback-Route", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nullGeometryResponse()));
        vi.mocked(loadGtfsTripShapePath).mockResolvedValue(GTFS_SHAPE);
        const api = createController();

        const route = await api.getTripRoute(FAHRTBEZEICHNER);

        expect(route?.properties.fpl_id).toBe(FPL_ID);
        expect(route?.properties.fahrtbezeichner).toBe(FAHRTBEZEICHNER);
    });

    it("verhindert die Route nicht, wenn keine GTFS-Shape existiert", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nullGeometryResponse()));
        vi.mocked(loadGtfsTripShapePath).mockResolvedValue(undefined);
        const api = createController();

        const route = await api.getTripRoute(FAHRTBEZEICHNER);

        expect(route).toBeUndefined();
    });

    it("erzeugt aus der GTFS-Fallback-Route einen Split, den der Renderer zeichnen kann", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nullGeometryResponse()));
        vi.mocked(loadGtfsTripShapePath).mockResolvedValue(GTFS_SHAPE);
        const api = createController();

        const route = await api.getTripRoute(FAHRTBEZEICHNER);
        expect(route).toBeDefined();

        const split = api.getRouteSplit(FAHRTBEZEICHNER, route!.mapCoordinates[0]!);
        expect(split).toBeDefined();

        const source = new VectorSource();
        renderBusradarRoute(source, split);
        expect(source.getFeatures().length).toBeGreaterThan(0);
    });

    it("versucht einen fehlgeschlagenen Routenabruf erst nach der Cooldown-Zeit erneut", async () => {
        vi.useFakeTimers();
        try {
            const fetchMock = vi
                .fn()
                .mockResolvedValueOnce({ ok: false, status: 500 } as unknown as Response)
                .mockResolvedValue(lineStringResponse());
            vi.stubGlobal("fetch", fetchMock);
            const api = createController();

            expect(await api.getTripRoute(FAHRTBEZEICHNER)).toBeUndefined();
            expect(fetchMock).toHaveBeenCalledTimes(1);

            // Innerhalb der Cooldown-Zeit kein erneuter Abruf (kein dauerhaftes hartes „failed").
            expect(await api.getTripRoute(FAHRTBEZEICHNER)).toBeUndefined();
            expect(fetchMock).toHaveBeenCalledTimes(1);

            // Nach Ablauf der Cooldown-Zeit wird erneut geladen und ein nun gültiger LineString
            // übernommen.
            vi.setSystemTime(Date.now() + RETRY_TTL_MS + 1);
            const route = await api.getTripRoute(FAHRTBEZEICHNER);
            expect(route?.lonLatCoordinates).toEqual(API_LINESTRING);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        } finally {
            vi.useRealTimers();
        }
    });
});

// Verhindert das Fahrzeug-Playback-Loop und die echte WebSocket-Verbindung, damit nur der
// Ingest-/Routen-Ladepfad des Controllers getestet wird.
class NoopWebSocket {
    onopen: unknown = null;
    onmessage: unknown = null;
    onerror: unknown = null;
    onclose: unknown = null;
    close() {}
}

function fahrzeugeResponse(): Response {
    return {
        ok: true,
        status: 200,
        json: async () => ({
            features: [
                {
                    geometry: { coordinates: GTFS_SHAPE[1] },
                    properties: {
                        fahrtbezeichner: FAHRTBEZEICHNER,
                        fpl_id: FPL_ID,
                        linientext: "9"
                    }
                }
            ]
        })
    } as unknown as Response;
}

async function waitUntil(predicate: () => boolean, tries = 60, delayMs = 5) {
    for (let attempt = 0; attempt < tries; attempt++) {
        if (predicate()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error("Bedingung wurde nicht rechtzeitig erfüllt.");
}

describe("Busradar-Route: GTFS-Fallback erreicht das Fahrzeug-Playback über den Ingest", () => {
    it("lädt die GTFS-Route beim Fahrzeug-Ingest ohne Auswahl und ohne getTripRoute", async () => {
        vi.stubGlobal("WebSocket", NoopWebSocket);
        // rAF-Callback bewusst nicht ausführen: der Playback-Loop soll im Test nicht laufen.
        vi.stubGlobal("requestAnimationFrame", vi.fn().mockReturnValue(0));
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
        vi.mocked(loadGtfsTripShapePath).mockResolvedValue(GTFS_SHAPE);

        vi.stubGlobal(
            "fetch",
            vi.fn((input: string | URL | Request) => {
                const url = String(input);
                if (url.includes("/fahrten/")) {
                    return Promise.resolve(nullGeometryResponse());
                }
                return Promise.resolve(fahrzeugeResponse());
            })
        );

        const layer = createBusradarLayer();
        const api = layer.get(BUSRADAR_CONTROLLER_PROPERTY) as BusradarControllerApi;
        const probeCoordinate = fromLonLat(GTFS_SHAPE[1]!) as [number, number];

        try {
            // Sichtbarkeit aktiviert den Controller (start()): REST-Snapshot → Ingest →
            // Routen-Ladepfad. Es wird bewusst nie api.getTripRoute(...) oder eine Auswahl genutzt.
            layer.setVisible(true);

            await waitUntil(
                () => api.getRouteSplit(FAHRTBEZEICHNER, probeCoordinate) !== undefined
            );

            // Der GTFS-Fallback wurde über den Ingest ausgelöst, nicht über eine Auswahl. Damit
            // steht dieselbe geladene Route auch dem allgemeinen Fahrzeug-Playback zur Verfügung
            // (getRouteSplit und das Playback lesen denselben tripRouteCache).
            expect(loadGtfsTripShapePath).toHaveBeenCalledWith(FPL_ID, FAHRTBEZEICHNER);

            const split = api.getRouteSplit(FAHRTBEZEICHNER, probeCoordinate);
            expect(split?.route.lonLatCoordinates).toEqual(GTFS_SHAPE);

            const source = new VectorSource();
            renderBusradarRoute(source, split);
            expect(source.getFeatures().length).toBeGreaterThan(0);
        } finally {
            layer.setVisible(false);
        }
    });
});
