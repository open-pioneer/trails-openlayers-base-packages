// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { classifyOccupancy } from "./occupancyUtils";

describe("classifyOccupancy", () => {
    it("ordnet schwache Auslastung der Stufe 'low' zu", () => {
        expect(classifyOccupancy("Schwach besetzt")).toBe("low");
        expect(classifyOccupancy("Niedrig")).toBe("low");
        expect(classifyOccupancy("Gering besetzt")).toBe("low");
    });

    it("ordnet mittlere Auslastung der Stufe 'medium' zu", () => {
        expect(classifyOccupancy("Mäßig besetzt")).toBe("medium");
        expect(classifyOccupancy("Mittel")).toBe("medium");
        expect(classifyOccupancy("Durchschnittlich besetzt")).toBe("medium");
    });

    it("ordnet hohe Auslastung der Stufe 'high' zu", () => {
        expect(classifyOccupancy("Stark besetzt")).toBe("high");
        expect(classifyOccupancy("Hoch")).toBe("high");
        expect(classifyOccupancy("Überfüllt")).toBe("high");
    });

    it("ist groß-/kleinschreibungsunabhängig und trimmt", () => {
        expect(classifyOccupancy("  STARK BESETZT  ")).toBe("high");
        expect(classifyOccupancy("schwach")).toBe("low");
    });

    it("gibt für nicht zuordenbare, nicht-leere Werte undefined zurück", () => {
        expect(classifyOccupancy("Sonderfahrt")).toBeUndefined();
        expect(classifyOccupancy("42")).toBeUndefined();
    });

    it("gibt für leere Werte und Nicht-Strings undefined zurück", () => {
        expect(classifyOccupancy("")).toBeUndefined();
        expect(classifyOccupancy("   ")).toBeUndefined();
        expect(classifyOccupancy(undefined)).toBeUndefined();
        expect(classifyOccupancy(null)).toBeUndefined();
        expect(classifyOccupancy(5)).toBeUndefined();
    });
});
