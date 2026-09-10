// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// transitDepartures hält einen modul-globalen Cache. Vor jedem Test wird das Modul zurückgesetzt
// und per dynamischem Import frisch geladen, damit Cache-Zustände nicht zwischen Tests lecken.
async function importDepartures() {
    return await import("./transitDepartures");
}

function jsonResponse(data: unknown, ok = true, status = 200): Response {
    return { ok, status, json: async () => data } as unknown as Response;
}

beforeEach(() => {
    vi.resetModules();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("loadTransitDepartures – Normalisierung", () => {
    it("normalisiert ein vollständiges Abfahrts-Objekt", async () => {
        const raw = {
            fahrtbezeichner: "trip-1",
            haltid: "stop-9",
            sequenz: 4,
            linientext: "R42",
            richtungstext: "Zentrum",
            abfahrtszeit: 1000,
            tatsaechliche_abfahrtszeit: 1200,
            ankunftszeit: 980,
            tatsaechliche_ankunftszeit: 1180,
            delay: 200,
            prognosemoeglich: "true",
            besetztgrad: "Niedrig"
        };
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([raw])));
        const { loadTransitDepartures } = await importDepartures();

        const departures = await loadTransitDepartures("S1");

        expect(departures).toEqual([
            {
                id: "trip-1",
                tripId: "trip-1",
                stopId: "stop-9",
                sequence: 4,
                line: "R42",
                destination: "Zentrum",
                plannedDepartureTime: 1000,
                realtimeDepartureTime: 1200,
                plannedArrivalTime: 980,
                realtimeArrivalTime: 1180,
                delaySeconds: 200,
                occupancy: "Niedrig",
                isRealtime: true
            }
        ]);
    });

    it("nutzt Fallbacks für fehlende Felder und markiert ohne Echtzeit isRealtime=false", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse([{}])));
        const { loadTransitDepartures } = await importDepartures();

        const [departure] = await loadTransitDepartures("S1");

        expect(departure).toEqual({
            id: "departure-0",
            line: "Bus",
            destination: "Keine Angabe",
            plannedDepartureTime: undefined,
            realtimeDepartureTime: undefined,
            delaySeconds: undefined,
            occupancy: undefined,
            isRealtime: false
        });
    });

    it("behandelt 'Unbekannt' und leere Auslastung als nicht vorhanden", async () => {
        const raw = [
            { fahrtbezeichner: "a", besetztgrad: "Unbekannt" },
            { fahrtbezeichner: "b", besetztgrad: "" }
        ];
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(raw)));
        const { loadTransitDepartures } = await importDepartures();

        const departures = await loadTransitDepartures("S1");

        expect(departures[0]!.occupancy).toBeUndefined();
        expect(departures[1]!.occupancy).toBeUndefined();
    });

    it("erkennt Echtzeit auch ohne prognosemoeglich, wenn eine tatsächliche Zeit vorliegt", async () => {
        const raw = [{ fahrtbezeichner: "a", tatsaechliche_abfahrtszeit: 1500 }];
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(raw)));
        const { loadTransitDepartures } = await importDepartures();

        const [departure] = await loadTransitDepartures("S1");

        expect(departure!.isRealtime).toBe(true);
        expect(departure!.realtimeDepartureTime).toBe(1500);
    });

    it("gibt eine leere Liste zurück, wenn die Antwort kein Array ist", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));
        const { loadTransitDepartures } = await importDepartures();

        await expect(loadTransitDepartures("S1")).resolves.toEqual([]);
    });
});

describe("loadTransitDepartures – Fehler und Cache", () => {
    it("wirft bei nicht erfolgreicher Antwort einen Fehler mit Status", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(undefined, false, 502)));
        const { loadTransitDepartures } = await importDepartures();

        await expect(loadTransitDepartures("S1")).rejects.toThrow("502");
    });

    it("cached Abfahrten für 30 s und lädt danach erneut", async () => {
        vi.useFakeTimers();
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jsonResponse([{ fahrtbezeichner: "a", linientext: "R1" }]));
        vi.stubGlobal("fetch", fetchMock);
        const { loadTransitDepartures } = await importDepartures();

        await loadTransitDepartures("S1");
        await loadTransitDepartures("S1");
        expect(fetchMock).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(31_000);
        await loadTransitDepartures("S1");
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("cached je Haltestelle getrennt", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jsonResponse([{ fahrtbezeichner: "a", linientext: "R1" }]));
        vi.stubGlobal("fetch", fetchMock);
        const { loadTransitDepartures } = await importDepartures();

        await loadTransitDepartures("S1");
        await loadTransitDepartures("S2");

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
