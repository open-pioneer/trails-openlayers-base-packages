// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { BusradarSelectionDetails } from "../types";

/** Auflösbarer Endzustand der Haltestellen-Ermittlung einer Busauswahl. */
export type BusradarResolvedStopsStatus = Extract<
    BusradarSelectionDetails["stopsStatus"],
    "available" | "partial" | "unavailable"
>;

/** Eingaben für die Ableitung des Haltestellen-Status. */
export type DeriveStopsStatusInput = {
    /** Ob eine vollständige statische Haltestellenfolge (GTFS) vorliegt. */
    hasStaticStopSequence: boolean;
    /** Aufgelöster Starthaltestellen-Name, falls bekannt. */
    startStopName?: string;
    /** Aufgelöster Zielhaltestellen-Name, falls bekannt. */
    endStopName?: string;
};

/**
 * Leitet den Haltestellen-Status einer Busauswahl aus den vorliegenden Daten ab.
 *
 * - vollständige statische Haltestellenfolge → `"available"`
 * - sonst mindestens ein Haltestellenname (Start oder Ziel) → `"partial"`
 * - sonst → `"unavailable"`
 *
 * Kapselt die zuvor an mehreren Stellen duplizierte Ableitung, damit die Regel
 * an einer Stelle liegt und isoliert testbar ist.
 */
export function deriveStopsStatus({
    hasStaticStopSequence,
    startStopName,
    endStopName
}: DeriveStopsStatusInput): BusradarResolvedStopsStatus {
    if (hasStaticStopSequence) {
        return "available";
    }
    return startStopName || endStopName ? "partial" : "unavailable";
}
