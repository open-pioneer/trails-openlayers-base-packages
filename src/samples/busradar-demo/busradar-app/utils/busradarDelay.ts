// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/** Sekunden pro Minute (fachliche Konstante der Delay-Klassifizierung). */
export const SECONDS_PER_MINUTE = 60;

/**
 * Zentrale fachliche Toleranz: Liegt der Betrag der Verspätung darunter, gilt die Fahrt als
 * „pünktlich" (deckt leicht zu frühe wie leicht verspätete Fahrten symmetrisch ab). Einzige
 * Wahrheit für alle Ansichten (Bus-Popover, Abfahrtszeile, Marker-/Legendenfarbe).
 */
export const BUSRADAR_DELAY_PUNCTUAL_MAX_ABS_S = 60;

/** Ergebnis der Delay-Klassifizierung: pünktlich, verspätet („late") oder zu früh („early"). */
export type BusradarDelayClass =
    | { kind: "punctual" }
    | { kind: "late"; minutes: number }
    | { kind: "early"; minutes: number };

/**
 * Klassifiziert einen Verspätungswert (Sekunden) fachlich einheitlich. `undefined`, wenn kein
 * verwertbarer Zahlenwert vorliegt (fehlende Echtzeitdaten). Positive Werte = Verspätung.
 * Minuten werden kaufmännisch gerundet und mindestens als 1 ausgewiesen.
 */
export function classifyBusradarDelay(
    delaySeconds: number | null | undefined
): BusradarDelayClass | undefined {
    if (delaySeconds == null || !Number.isFinite(delaySeconds)) {
        return undefined;
    }
    if (Math.abs(delaySeconds) < BUSRADAR_DELAY_PUNCTUAL_MAX_ABS_S) {
        return { kind: "punctual" };
    }
    const minutes = Math.max(1, Math.round(Math.abs(delaySeconds) / SECONDS_PER_MINUTE));
    return delaySeconds < 0 ? { kind: "early", minutes } : { kind: "late", minutes };
}

/**
 * Wählt den für den Bus-Popover-Status maßgeblichen Delay: bevorzugt den haltbezogenen Delay der
 * aktuell angezeigten nächsten/fokussierten Haltestelle (identische Basis wie die Abfahrtszeile),
 * andernfalls als Fallback den allgemeinen Fahrzeug- bzw. Routen-Delay. `0` gilt als vorhanden.
 */
export function selectBusradarPopupDelay(
    stopDelaySeconds: number | null | undefined,
    vehicleDelaySeconds: number | null | undefined,
    routeDelaySeconds?: number | null | undefined
): number | null | undefined {
    return stopDelaySeconds ?? vehicleDelaySeconds ?? routeDelaySeconds;
}
