// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Die API-Module haben modul-globale Caches. Vor jedem Test werden die Module zurückgesetzt und
// per dynamischem Import frisch geladen, damit Tests unabhängig voneinander sind.
async function importTransitStops() {
    return await import("./transitStops");
}

function jsonResponse(data: unknown, ok = true, status = 200): Response {
    return { ok, status, json: async () => data } as unknown as Response;
}

function stopFeature(overrides: Record<string, unknown> = {}) {
    return {
        geometry: { type: "Point", coordinates: [7.6261, 51.9607] },
        properties: {
            nr: 4711,
            lbez: "Domplatz",
            kbez: "Dom",
            richtung: "Zentrum",
            global_id: "de:05515:4711:1:2"
        },
        ...overrides
    };
}

beforeEach(() => {
    vi.resetModules();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("loadTransitStops – Parsing", () => {
    it("parst ein gültiges Haltestellen-Feature vollständig", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ features: [stopFeature()] }))
        );
        const { loadTransitStops } = await importTransitStops();

        const stops = await loadTransitStops();

        expect(stops).toHaveLength(1);
        expect(stops[0]).toEqual({
            stopId: "4711",
            parentStationId: "4711",
            name: "Domplatz",
            shortName: "Dom",
            platform: "2",
            direction: "Zentrum",
            lonLat: [7.6261, 51.9607]
        });
    });

    it("filtert ungültige Features (fehlender Name, falsche Geometrie, ungültige Koordinaten)", async () => {
        const collection = {
            features: [
                stopFeature(),
                stopFeature({ properties: { nr: 1, global_id: "x" } }), // kein lbez
                stopFeature({ geometry: { type: "LineString", coordinates: [7.6, 51.9] } }),
                stopFeature({ geometry: { type: "Point", coordinates: [Number.NaN, 51.9] } }),
                stopFeature({ geometry: { type: "Point", coordinates: [7.6] } })
            ]
        };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(collection)));
        const { loadTransitStops } = await importTransitStops();

        const stops = await loadTransitStops();

        expect(stops).toHaveLength(1);
        expect(stops[0]!.stopId).toBe("4711");
    });

    it("nutzt die letzten zwei Zeichen der Haltestellen-ID als Plattform-Fallback", async () => {
        const feature = stopFeature({
            properties: { nr: 98765, lbez: "Hafen", global_id: "de:05515:98765" }
        });
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ features: [feature] })));
        const { loadTransitStops } = await importTransitStops();

        const stops = await loadTransitStops();

        expect(stops[0]!.parentStationId).toBe("98765");
        expect(stops[0]!.platform).toBe("65");
    });

    it("gibt eine leere Liste zurück, wenn keine Features vorhanden sind", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));
        const { loadTransitStops } = await importTransitStops();

        await expect(loadTransitStops()).resolves.toEqual([]);
    });
});

describe("loadTransitStops – Fehler, Retry und Abort", () => {
    it("wirft bei nicht erfolgreicher Antwort einen Fehler mit Status", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(undefined, false, 503)));
        const { loadTransitStops } = await importTransitStops();

        await expect(loadTransitStops()).rejects.toThrow("503");
    });

    it("cached fehlgeschlagene Ladeversuche nicht und lädt beim nächsten Aufruf erneut (F-05)", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(undefined, false, 500))
            .mockResolvedValueOnce(jsonResponse({ features: [stopFeature()] }));
        vi.stubGlobal("fetch", fetchMock);
        const { loadTransitStops } = await importTransitStops();

        await expect(loadTransitStops()).rejects.toThrow("500");
        const stops = await loadTransitStops();

        expect(stops).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("liefert nur einmal und teilt das Ergebnis bei mehrfachen Aufrufen", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ features: [stopFeature()] }));
        vi.stubGlobal("fetch", fetchMock);
        const { loadTransitStops } = await importTransitStops();

        const [a, b] = await Promise.all([loadTransitStops(), loadTransitStops()]);

        expect(a).toBe(b);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("bricht mit einem bereits abgebrochenen Signal ab", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ features: [] })));
        const { loadTransitStops } = await importTransitStops();
        const controller = new AbortController();
        controller.abort();

        await expect(loadTransitStops(controller.signal)).rejects.toMatchObject({
            name: "AbortError"
        });
    });

    it("bricht ab, wenn das Signal nach dem Aufruf ausgelöst wird", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ features: [] })));
        const { loadTransitStops } = await importTransitStops();
        const controller = new AbortController();

        const promise = loadTransitStops(controller.signal);
        controller.abort();

        await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    });
});
