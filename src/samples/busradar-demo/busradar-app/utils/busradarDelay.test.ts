// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import {
    BUSRADAR_DELAY_PUNCTUAL_MAX_ABS_S,
    classifyBusradarDelay,
    selectBusradarPopupDelay
} from "./busradarDelay";

describe("classifyBusradarDelay", () => {
    it("gilt bis 59 s (unter der Toleranz) als pünktlich", () => {
        expect(classifyBusradarDelay(0)).toEqual({ kind: "punctual" });
        expect(classifyBusradarDelay(59)).toEqual({ kind: "punctual" });
        expect(classifyBusradarDelay(-59)).toEqual({ kind: "punctual" });
    });

    it("wertet 60 s als 1 Minute verspätet", () => {
        expect(classifyBusradarDelay(60)).toEqual({ kind: "late", minutes: 1 });
    });

    it("wertet -60 s als 1 Minute zu früh", () => {
        expect(classifyBusradarDelay(-60)).toEqual({ kind: "early", minutes: 1 });
    });

    it("rundet größere Verspätungen kaufmännisch auf Minuten", () => {
        expect(classifyBusradarDelay(89)).toEqual({ kind: "late", minutes: 1 });
        expect(classifyBusradarDelay(90)).toEqual({ kind: "late", minutes: 2 });
        expect(classifyBusradarDelay(300)).toEqual({ kind: "late", minutes: 5 });
    });

    it("liefert undefined ohne verwertbare Echtzeitdaten", () => {
        expect(classifyBusradarDelay(undefined)).toBeUndefined();
        expect(classifyBusradarDelay(null)).toBeUndefined();
        expect(classifyBusradarDelay(Number.NaN)).toBeUndefined();
    });

    it("nutzt exakt die zentrale Toleranzkonstante als Grenze", () => {
        expect(classifyBusradarDelay(BUSRADAR_DELAY_PUNCTUAL_MAX_ABS_S - 1)).toEqual({
            kind: "punctual"
        });
        expect(classifyBusradarDelay(BUSRADAR_DELAY_PUNCTUAL_MAX_ABS_S)).toEqual({
            kind: "late",
            minutes: 1
        });
    });
});

describe("selectBusradarPopupDelay", () => {
    it("bevorzugt den haltbezogenen Delay vor dem Fahrzeug-Delay", () => {
        expect(selectBusradarPopupDelay(60, 10, 20)).toBe(60);
    });

    it("nutzt auch einen haltbezogenen Delay von 0 (pünktlich) vor dem Fallback", () => {
        expect(selectBusradarPopupDelay(0, 120)).toBe(0);
    });

    it("fällt auf den Fahrzeug-Delay zurück, wenn kein Halt-Delay vorhanden ist", () => {
        expect(selectBusradarPopupDelay(undefined, 45)).toBe(45);
        expect(selectBusradarPopupDelay(null, 45)).toBe(45);
    });

    it("fällt zuletzt auf den Routen-Delay zurück", () => {
        expect(selectBusradarPopupDelay(undefined, undefined, 30)).toBe(30);
    });
});
