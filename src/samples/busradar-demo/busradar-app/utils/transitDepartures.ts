// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { TransitDeparture } from "../api/transitDepartures";

/**
 * Kleine Toleranz (Sekunden), innerhalb derer eine gerade vergangene Abfahrt noch sichtbar bleibt.
 * Verhindert Flackern bei minimal verspäteten Prognosen oder leicht abweichenden Uhren.
 */
const DEPARTURE_PAST_GRACE_S = 60;

/**
 * Entfernt bereits vergangene Abfahrten aus einer Liste, damit stets nur zukünftige Abfahrten
 * angezeigt werden. Maßgeblich ist die tatsächliche Abfahrtszeit (`realtimeDepartureTime`) vor der
 * planmäßigen (`plannedDepartureTime`). Abfahrten ohne bestimmbare Zeit bleiben erhalten.
 */
export function filterUpcomingDepartures(
    departures: TransitDeparture[],
    nowSeconds: number
): TransitDeparture[] {
    return departures.filter((departure) => {
        const time = departure.realtimeDepartureTime ?? departure.plannedDepartureTime;
        return time == null || time >= nowSeconds - DEPARTURE_PAST_GRACE_S;
    });
}
