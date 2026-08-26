// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { TransitStop } from "../api/transitStops";
import { findNearestStops } from "./nearestStops";

const ORIGIN: [number, number] = [7.6, 52.0];
// Bei ~52° Breite entspricht 1° Breite ~111320 m; ein Breiten-Offset erzeugt so gut
// kontrollierbare Distanzen (Δlat ≈ Meter / 111320).
const METERS_PER_DEG_LAT = 111320;

function stopAtMeters(
    id: string,
    meters: number,
    overrides: Partial<TransitStop> = {}
): TransitStop {
    return {
        stopId: id,
        name: overrides.name ?? `Stop ${id}`,
        lonLat: [ORIGIN[0], ORIGIN[1] + meters / METERS_PER_DEG_LAT],
        ...overrides
    };
}

describe("findNearestStops", () => {
    it("gibt eine leere Liste zurück, wenn keine Haltestelle im 500-m-Radius liegt", () => {
        const stops = [stopAtMeters("a", 600), stopAtMeters("b", 900), stopAtMeters("c", 1500)];
        expect(findNearestStops(ORIGIN, stops)).toEqual([]);
    });

    it("liefert genau eine Haltestelle, wenn nur eine im Radius liegt", () => {
        const stops = [stopAtMeters("a", 120), stopAtMeters("b", 800)];
        const result = findNearestStops(ORIGIN, stops);
        expect(result).toHaveLength(1);
        expect(result[0]!.stop.stopId).toBe("a");
        expect(result[0]!.distanceMeters).toBeCloseTo(120, 0);
    });

    it("gibt bei mehr als drei Treffern maximal drei zurück", () => {
        const stops = [
            stopAtMeters("a", 100),
            stopAtMeters("b", 150),
            stopAtMeters("c", 200),
            stopAtMeters("d", 250),
            stopAtMeters("e", 300)
        ];
        const result = findNearestStops(ORIGIN, stops);
        expect(result).toHaveLength(3);
        expect(result.map((r) => r.stop.stopId)).toEqual(["a", "b", "c"]);
    });

    it("sortiert die Treffer aufsteigend nach Entfernung", () => {
        const stops = [
            stopAtMeters("far", 300),
            stopAtMeters("near", 100),
            stopAtMeters("mid", 200)
        ];
        const result = findNearestStops(ORIGIN, stops);
        expect(result.map((r) => r.stop.stopId)).toEqual(["near", "mid", "far"]);
        expect(result[0]!.distanceMeters).toBeLessThan(result[1]!.distanceMeters);
        expect(result[1]!.distanceMeters).toBeLessThan(result[2]!.distanceMeters);
    });

    it("schließt Haltestellen außerhalb von 500 m aus (Grenze inklusive)", () => {
        const stops = [
            stopAtMeters("in", 480),
            stopAtMeters("edge", 500),
            stopAtMeters("out", 520)
        ];
        const result = findNearestStops(ORIGIN, stops);
        expect(result.map((r) => r.stop.stopId)).toEqual(["in", "edge"]);
    });

    it("behandelt gleiche/sehr ähnliche Positionen korrekt", () => {
        const stops = [
            stopAtMeters("a", 0, { parentStationId: "A", name: "A" }),
            stopAtMeters("b", 0, { parentStationId: "B", name: "B" })
        ];
        const result = findNearestStops(ORIGIN, stops);
        // Unterschiedliche Stationen an derselben Position bleiben beide erhalten.
        expect(result).toHaveLength(2);
        expect(result[0]!.distanceMeters).toBeCloseTo(0, 3);
    });

    it("dedupliziert über parentStationId und behält den nächstgelegenen Bahnsteig", () => {
        const stops = [
            stopAtMeters("far-platform", 300, { parentStationId: "S1", name: "Goebenstraße" }),
            stopAtMeters("near-platform", 100, { parentStationId: "S1", name: "Goebenstraße" }),
            stopAtMeters("other", 200, { parentStationId: "S2", name: "Geiststraße" })
        ];
        const result = findNearestStops(ORIGIN, stops);
        expect(result).toHaveLength(2);
        expect(result[0]!.stop.stopId).toBe("near-platform");
        expect(result[0]!.stop.parentStationId).toBe("S1");
        expect(result[1]!.stop.stopId).toBe("other");
        // Der weiter entfernte Bahnsteig derselben Station erscheint nicht erneut.
        expect(result.map((r) => r.stop.stopId)).not.toContain("far-platform");
    });

    it("dedupliziert über den normalisierten Namen (trim + Groß-/Kleinschreibung) ohne parentStationId", () => {
        const stops = [
            stopAtMeters("far", 300, { name: "  Goebenstraße " }),
            stopAtMeters("near", 100, { name: "goebenstraße" }),
            stopAtMeters("keep", 250, { name: "St.-Antonius-Kirche" })
        ];
        const result = findNearestStops(ORIGIN, stops);
        expect(result).toHaveLength(2);
        expect(result[0]!.stop.stopId).toBe("near");
        expect(result[1]!.stop.stopId).toBe("keep");
        expect(result.map((r) => r.stop.stopId)).not.toContain("far");
    });

    it("respektiert überschriebene Radius-/Trefferzahl-Optionen", () => {
        const stops = [stopAtMeters("a", 100), stopAtMeters("b", 200), stopAtMeters("c", 900)];
        const result = findNearestStops(ORIGIN, stops, { maxRadiusMeters: 1000, maxResults: 2 });
        expect(result.map((r) => r.stop.stopId)).toEqual(["a", "b"]);
    });
});
