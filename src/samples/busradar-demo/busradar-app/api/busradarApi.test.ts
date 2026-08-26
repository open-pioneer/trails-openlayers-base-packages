// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { BUSRADAR_API_BASE_URL, BUSRADAR_STOPS_URL, buildStopDeparturesUrl } from "./busradarApi";

describe("Busradar-API-Konstanten", () => {
    it("leitet die Haltestellen-URL aus der Basis-URL ab", () => {
        expect(BUSRADAR_API_BASE_URL).toBe("https://rest.busradar.conterra.de/prod");
        expect(BUSRADAR_STOPS_URL).toBe(`${BUSRADAR_API_BASE_URL}/haltestellen`);
    });
});

describe("buildStopDeparturesUrl", () => {
    it("baut die Abfahrten-URL mit einheitlichen Query-Parametern", () => {
        expect(buildStopDeparturesUrl("12345")).toBe(
            `${BUSRADAR_STOPS_URL}/12345/abfahrten?sekunden=7200&maxanzahl=80`
        );
    });

    it("kodiert die Haltestellen-ID URL-sicher", () => {
        expect(buildStopDeparturesUrl("a/b")).toBe(
            `${BUSRADAR_STOPS_URL}/a%2Fb/abfahrten?sekunden=7200&maxanzahl=80`
        );
    });
});
