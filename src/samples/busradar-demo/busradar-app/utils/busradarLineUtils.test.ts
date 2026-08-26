// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { lineMatchesBusradarFilter, normalizeBusradarLine } from "./busradarLineUtils";

describe("normalizeBusradarLine", () => {
    it("trimmt und schreibt klein", () => {
        expect(normalizeBusradarLine("  R42 ")).toBe("r42");
        expect(normalizeBusradarLine("S1")).toBe("s1");
    });

    it("gibt einen leeren String für Nicht-Strings zurück", () => {
        expect(normalizeBusradarLine(42)).toBe("");
        expect(normalizeBusradarLine(undefined)).toBe("");
        expect(normalizeBusradarLine(null)).toBe("");
    });
});

describe("lineMatchesBusradarFilter", () => {
    it("lässt bei leerem Filter jede Linie durch", () => {
        expect(lineMatchesBusradarFilter("R42", [])).toBe(true);
        expect(lineMatchesBusradarFilter(undefined, [])).toBe(true);
    });

    it("matcht unabhängig von Groß-/Kleinschreibung und Leerzeichen", () => {
        expect(lineMatchesBusradarFilter(" R42 ", ["r42"])).toBe(true);
        expect(lineMatchesBusradarFilter("r42", ["R42"])).toBe(true);
    });

    it("matcht nicht, wenn die Linie nicht im Filter enthalten ist", () => {
        expect(lineMatchesBusradarFilter("R7", ["R42", "S1"])).toBe(false);
    });

    it("behandelt eine der Linien in einem mehrelementigen Filter korrekt", () => {
        expect(lineMatchesBusradarFilter("S1", ["R42", "S1"])).toBe(true);
    });

    it("matcht eine Nicht-String-Linie nur, wenn der leere String im Filter steht", () => {
        expect(lineMatchesBusradarFilter(42, ["R42"])).toBe(false);
        expect(lineMatchesBusradarFilter(42, [""])).toBe(true);
    });
});
