// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { BUSRADAR_DELAY_COLORS, getBusradarDelayStatus, getDelayColor } from "./busradarLayer";

describe("getDelayColor", () => {
    it("gibt grün für pünktliche oder frühe Fahrzeuge zurück", () => {
        expect(getDelayColor(0)).toBe(BUSRADAR_DELAY_COLORS.green);
        expect(getDelayColor(59)).toBe(BUSRADAR_DELAY_COLORS.green);
        expect(getDelayColor(-100)).toBe(BUSRADAR_DELAY_COLORS.green);
    });

    it("gibt gelb ab 60 s bis einschließlich 240 s (4 Min.) zurück", () => {
        expect(getDelayColor(60)).toBe(BUSRADAR_DELAY_COLORS.yellow);
        expect(getDelayColor(119)).toBe(BUSRADAR_DELAY_COLORS.yellow);
        expect(getDelayColor(120)).toBe(BUSRADAR_DELAY_COLORS.yellow);
        expect(getDelayColor(240)).toBe(BUSRADAR_DELAY_COLORS.yellow);
    });

    it("gibt rot erst bei mehr als 240 s (>4 Min.) zurück", () => {
        expect(getDelayColor(241)).toBe(BUSRADAR_DELAY_COLORS.red);
        expect(getDelayColor(600)).toBe(BUSRADAR_DELAY_COLORS.red);
    });
});

describe("getBusradarDelayStatus", () => {
    it("meldet fehlende Echtzeitdaten für nicht-numerische Werte", () => {
        expect(getBusradarDelayStatus(undefined)).toEqual({
            color: BUSRADAR_DELAY_COLORS.gray,
            label: "Keine Echtzeitdaten"
        });
        expect(getBusradarDelayStatus("abc")).toEqual({
            color: BUSRADAR_DELAY_COLORS.gray,
            label: "Keine Echtzeitdaten"
        });
    });

    it("wertet einen numerischen String aus", () => {
        expect(getBusradarDelayStatus("120")).toEqual({
            color: BUSRADAR_DELAY_COLORS.yellow,
            label: "2 Min. verspätet",
            delay: 120
        });
    });

    it("meldet 'Pünktlich' innerhalb von ±60 s (grün)", () => {
        expect(getBusradarDelayStatus(0)).toEqual({
            color: BUSRADAR_DELAY_COLORS.green,
            label: "Pünktlich",
            delay: 0
        });
        expect(getBusradarDelayStatus(59)).toEqual({
            color: BUSRADAR_DELAY_COLORS.green,
            label: "Pünktlich",
            delay: 59
        });
    });

    it("rundet Verspätungen auf Minuten und wählt die passende Farbe", () => {
        expect(getBusradarDelayStatus(60)).toEqual({
            color: BUSRADAR_DELAY_COLORS.yellow,
            label: "1 Min. verspätet",
            delay: 60
        });
        expect(getBusradarDelayStatus(119)).toEqual({
            color: BUSRADAR_DELAY_COLORS.yellow,
            label: "2 Min. verspätet",
            delay: 119
        });
        expect(getBusradarDelayStatus(120)).toEqual({
            color: BUSRADAR_DELAY_COLORS.yellow,
            label: "2 Min. verspätet",
            delay: 120
        });
        expect(getBusradarDelayStatus(240)).toEqual({
            color: BUSRADAR_DELAY_COLORS.yellow,
            label: "4 Min. verspätet",
            delay: 240
        });
        expect(getBusradarDelayStatus(300)).toEqual({
            color: BUSRADAR_DELAY_COLORS.red,
            label: "5 Min. verspätet",
            delay: 300
        });
    });

    it("beschriftet frühe Fahrzeuge als 'früher' und bleibt farblich grün", () => {
        expect(getBusradarDelayStatus(-60)).toEqual({
            color: BUSRADAR_DELAY_COLORS.green,
            label: "1 Min. früher",
            delay: -60
        });
        expect(getBusradarDelayStatus(-120)).toEqual({
            color: BUSRADAR_DELAY_COLORS.green,
            label: "2 Min. früher",
            delay: -120
        });
    });
});
