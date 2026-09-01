// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { deriveStopsStatus } from "./busradarSelectionDetails";

describe("deriveStopsStatus", () => {
    it("ist 'available' bei vollständiger statischer Haltestellenfolge", () => {
        expect(
            deriveStopsStatus({ hasStaticStopSequence: true, startStopName: "A", endStopName: "B" })
        ).toBe("available");
        // auch ohne Namen bleibt es 'available', wenn die Sequenz vorhanden ist
        expect(deriveStopsStatus({ hasStaticStopSequence: true })).toBe("available");
    });

    it("ist 'partial', wenn nur ein Haltestellenname vorliegt", () => {
        expect(deriveStopsStatus({ hasStaticStopSequence: false, startStopName: "A" })).toBe(
            "partial"
        );
        expect(deriveStopsStatus({ hasStaticStopSequence: false, endStopName: "B" })).toBe(
            "partial"
        );
    });

    it("ist 'unavailable' ohne Sequenz und ohne Namen", () => {
        expect(deriveStopsStatus({ hasStaticStopSequence: false })).toBe("unavailable");
        expect(
            deriveStopsStatus({
                hasStaticStopSequence: false,
                startStopName: "",
                endStopName: ""
            })
        ).toBe("unavailable");
    });
});
