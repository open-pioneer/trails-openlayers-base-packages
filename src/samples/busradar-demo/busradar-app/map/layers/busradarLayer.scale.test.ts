// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { getBusradarZoomScaleFactor } from "./busradarLayer";

const REFERENCE_ZOOM = 16;
const PER_ZOOM = 0.09;
const MIN_FACTOR = 0.65;
const MAX_FACTOR = 1.35;

describe("getBusradarZoomScaleFactor", () => {
    it("liefert am Referenz-Zoom den Faktor 1.0", () => {
        expect(getBusradarZoomScaleFactor(REFERENCE_ZOOM)).toBeCloseTo(1, 10);
    });

    it("verkleinert beim Herauszoomen und vergrößert beim Hineinzoomen", () => {
        expect(getBusradarZoomScaleFactor(REFERENCE_ZOOM - 2)).toBeCloseTo(1 - 2 * PER_ZOOM, 10);
        expect(getBusradarZoomScaleFactor(REFERENCE_ZOOM + 2)).toBeCloseTo(1 + 2 * PER_ZOOM, 10);
    });

    it("klammert nach unten auf den Minimalfaktor", () => {
        expect(getBusradarZoomScaleFactor(5)).toBe(MIN_FACTOR);
        expect(getBusradarZoomScaleFactor(0)).toBe(MIN_FACTOR);
        expect(getBusradarZoomScaleFactor(-10)).toBe(MIN_FACTOR);
    });

    it("klammert nach oben auf den Maximalfaktor", () => {
        expect(getBusradarZoomScaleFactor(22)).toBe(MAX_FACTOR);
        expect(getBusradarZoomScaleFactor(30)).toBe(MAX_FACTOR);
    });

    it("ist monoton steigend über den Zoom", () => {
        const zooms = [8, 11, 14, 16, 17, 18, 20, 24];
        const factors = zooms.map(getBusradarZoomScaleFactor);
        for (let i = 1; i < factors.length; i++) {
            expect(factors[i]!).toBeGreaterThanOrEqual(factors[i - 1]!);
        }
    });

    it("bleibt stets innerhalb der definierten Grenzen", () => {
        for (let zoom = -5; zoom <= 30; zoom += 0.5) {
            const factor = getBusradarZoomScaleFactor(zoom);
            expect(factor).toBeGreaterThanOrEqual(MIN_FACTOR);
            expect(factor).toBeLessThanOrEqual(MAX_FACTOR);
        }
    });

    it("fällt bei nicht-endlichen Zoomwerten sicher auf 1.0 zurück", () => {
        expect(getBusradarZoomScaleFactor(Number.NaN)).toBe(1);
        expect(getBusradarZoomScaleFactor(Number.POSITIVE_INFINITY)).toBe(1);
        expect(getBusradarZoomScaleFactor(Number.NEGATIVE_INFINITY)).toBe(1);
    });
});
