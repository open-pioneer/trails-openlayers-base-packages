// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { TransitDeparture } from "../api/transitDepartures";
import { filterUpcomingDepartures } from "./transitDepartures";

const NOW_SECONDS = 1_800_000_000;

function departure(overrides: Partial<TransitDeparture> & { id: string }): TransitDeparture {
    return {
        line: "14",
        destination: "Zentrum",
        isRealtime: true,
        ...overrides
    };
}

describe("filterUpcomingDepartures", () => {
    it("entfernt vergangene Abfahrten und behält zukünftige", () => {
        const result = filterUpcomingDepartures(
            [
                departure({ id: "past", realtimeDepartureTime: NOW_SECONDS - 600 }),
                departure({ id: "future", realtimeDepartureTime: NOW_SECONDS + 600 })
            ],
            NOW_SECONDS
        );
        expect(result.map((d) => d.id)).toEqual(["future"]);
    });

    it("bevorzugt die Realtime-Abfahrtszeit vor der planmäßigen", () => {
        const result = filterUpcomingDepartures(
            [
                departure({
                    id: "delayed-into-future",
                    plannedDepartureTime: NOW_SECONDS - 300,
                    realtimeDepartureTime: NOW_SECONDS + 300
                })
            ],
            NOW_SECONDS
        );
        expect(result.map((d) => d.id)).toEqual(["delayed-into-future"]);
    });

    it("behält Abfahrten innerhalb der Toleranz und ohne bestimmbare Zeit", () => {
        const result = filterUpcomingDepartures(
            [
                departure({ id: "just-passed", realtimeDepartureTime: NOW_SECONDS - 30 }),
                departure({ id: "no-time" })
            ],
            NOW_SECONDS
        );
        expect(result.map((d) => d.id)).toEqual(["just-passed", "no-time"]);
    });
});
