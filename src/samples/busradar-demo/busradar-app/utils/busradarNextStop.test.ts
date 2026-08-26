// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { BusradarTripStop } from "../api/busradarTripDetails";
import { gtfsClockToEpochSeconds, resolveBusradarNextStop } from "./busradarNextStop";

// Fester Referenzzeitpunkt (lokal): 2026-07-31 12:00:00.
const NOW_SECONDS = Math.floor(new Date(2026, 6, 31, 12, 0, 0).getTime() / 1000);

function tripStop(
    overrides: Partial<BusradarTripStop> & { stopSequence: number }
): BusradarTripStop {
    return {
        stopId: `stop-${overrides.stopSequence}`,
        stopName: `Haltestelle ${overrides.stopSequence}`,
        arrivalTime: "12:00:00",
        departureTime: "12:00:30",
        isNext: false,
        ...overrides
    };
}

describe("resolveBusradarNextStop", () => {
    it("liefert die allgemeine nächste Haltestelle (isNext) mit Realtime-Prognose", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [
                        tripStop({
                            stopSequence: 5,
                            stopName: "Domplatz",
                            isNext: true,
                            predictedArrivalTime: NOW_SECONDS + 120
                        }),
                        tripStop({ stopSequence: 6, predictedArrivalTime: NOW_SECONDS + 300 })
                    ]
                },
                vehicleSequence: 4
            },
            NOW_SECONDS
        );
        expect(result).toEqual({
            stopName: "Domplatz",
            arrivalTime: NOW_SECONDS + 120,
            isRealtime: true
        });
    });

    it("bevorzugt die Prognose vor der planmäßigen Zeit", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [
                        tripStop({
                            stopSequence: 2,
                            isNext: true,
                            arrivalTime: "12:10:00",
                            predictedArrivalTime: NOW_SECONDS + 240
                        })
                    ]
                }
            },
            NOW_SECONDS
        );
        expect(result?.arrivalTime).toBe(NOW_SECONDS + 240);
        expect(result?.isRealtime).toBe(true);
    });

    it("nutzt die planmäßige Ankunftszeit, wenn keine Prognose vorliegt", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [tripStop({ stopSequence: 2, isNext: true, arrivalTime: "12:05:00" })]
                }
            },
            NOW_SECONDS
        );
        expect(result?.isRealtime).toBe(false);
        expect(result?.arrivalTime).toBe(gtfsClockToEpochSeconds("12:05:00", NOW_SECONDS));
    });

    it("priorisiert die Fokus-Haltestelle, solange sie nicht passiert wurde", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [
                        tripStop({
                            stopSequence: 5,
                            stopName: "Zwischenhalt",
                            isNext: true,
                            predictedArrivalTime: NOW_SECONDS + 60
                        }),
                        tripStop({
                            stopId: "focus",
                            stopSequence: 8,
                            stopName: "Zielhalt",
                            predictedArrivalTime: NOW_SECONDS + 400
                        })
                    ]
                },
                vehicleSequence: 4,
                focusedStop: { stopId: "focus", stopName: "Zielhalt", stopSequence: 8 }
            },
            NOW_SECONDS
        );
        expect(result).toEqual({
            stopName: "Zielhalt",
            arrivalTime: NOW_SECONDS + 400,
            isRealtime: true
        });
    });

    it("wechselt nach dem Passieren der Fokus-Haltestelle auf die allgemeine nächste Haltestelle", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [
                        tripStop({
                            stopSequence: 9,
                            stopName: "Nächster Halt",
                            isNext: true,
                            predictedArrivalTime: NOW_SECONDS + 90
                        })
                    ]
                },
                vehicleSequence: 8,
                focusedStop: { stopId: "focus", stopName: "Zielhalt", stopSequence: 8 }
            },
            NOW_SECONDS
        );
        expect(result?.stopName).toBe("Nächster Halt");
        expect(result?.arrivalTime).toBe(NOW_SECONDS + 90);
    });

    it("nutzt den Abfahrt-Snapshot, wenn die Fokus-Haltestelle nicht in den Trip-Stops steht", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: { stops: [] },
                vehicleSequence: 2,
                focusedStop: {
                    stopId: "unknown",
                    stopName: "Snapshot-Halt",
                    stopSequence: 8,
                    arrivalTime: NOW_SECONDS + 500,
                    isRealtime: true
                }
            },
            NOW_SECONDS
        );
        expect(result).toEqual({
            stopName: "Snapshot-Halt",
            arrivalTime: NOW_SECONDS + 500,
            isRealtime: true
        });
    });

    it("blendet vergangene Ankunftszeiten aus", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [
                        tripStop({
                            stopSequence: 2,
                            isNext: true,
                            predictedArrivalTime: NOW_SECONDS - 120
                        })
                    ]
                }
            },
            NOW_SECONDS
        );
        expect(result).toBeUndefined();
    });

    it("liefert undefined ohne Trip-Stops und ohne Fokus-Haltestelle", () => {
        expect(resolveBusradarNextStop({}, NOW_SECONDS)).toBeUndefined();
        expect(resolveBusradarNextStop({ tripStops: { stops: [] } }, NOW_SECONDS)).toBeUndefined();
    });

    it("gibt den haltbezogenen Delay der nächsten Haltestelle weiter", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: {
                    stops: [
                        tripStop({
                            stopSequence: 3,
                            isNext: true,
                            predictedArrivalTime: NOW_SECONDS + 120,
                            delay: 75
                        })
                    ]
                }
            },
            NOW_SECONDS
        );
        expect(result?.delaySeconds).toBe(75);
    });

    it("gibt den Delay der Fokus-Abfahrt aus dem Snapshot weiter", () => {
        const result = resolveBusradarNextStop(
            {
                tripStops: { stops: [] },
                vehicleSequence: 2,
                focusedStop: {
                    stopId: "unknown",
                    stopName: "Snapshot-Halt",
                    stopSequence: 8,
                    arrivalTime: NOW_SECONDS + 500,
                    isRealtime: true,
                    delaySeconds: 90
                }
            },
            NOW_SECONDS
        );
        expect(result?.delaySeconds).toBe(90);
    });
});

describe("gtfsClockToEpochSeconds", () => {
    it("wandelt eine Uhrzeit des aktuellen Servicetags um", () => {
        expect(gtfsClockToEpochSeconds("12:30:00", NOW_SECONDS)).toBe(NOW_SECONDS + 30 * 60);
    });

    it("behandelt GTFS-Stunden ≥ 24 als Folgetag", () => {
        const expected = Math.floor(new Date(2026, 7, 1, 1, 0, 0).getTime() / 1000);
        expect(gtfsClockToEpochSeconds("25:00:00", NOW_SECONDS)).toBe(expected);
    });

    it("gibt undefined für ungültige Eingaben zurück", () => {
        expect(gtfsClockToEpochSeconds(undefined, NOW_SECONDS)).toBeUndefined();
        expect(gtfsClockToEpochSeconds("abc", NOW_SECONDS)).toBeUndefined();
    });
});
