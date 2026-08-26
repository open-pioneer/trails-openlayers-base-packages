// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { getOptionalNumber, getOptionalString, isDefined, isDefinedString } from "./valueUtils";

describe("getOptionalString", () => {
    it("gibt einen nicht-leeren String unverändert zurück", () => {
        expect(getOptionalString("Haltestelle")).toBe("Haltestelle");
    });

    it("gibt undefined für einen leeren String zurück", () => {
        expect(getOptionalString("")).toBeUndefined();
    });

    it("gibt undefined für Nicht-Strings zurück", () => {
        expect(getOptionalString(123)).toBeUndefined();
        expect(getOptionalString(null)).toBeUndefined();
        expect(getOptionalString(undefined)).toBeUndefined();
        expect(getOptionalString({})).toBeUndefined();
    });
});

describe("getOptionalNumber", () => {
    it("gibt endliche Zahlen zurück", () => {
        expect(getOptionalNumber(42)).toBe(42);
        expect(getOptionalNumber(0)).toBe(0);
        expect(getOptionalNumber(-7.5)).toBe(-7.5);
    });

    it("wandelt numerische Strings in Zahlen um", () => {
        expect(getOptionalNumber("120")).toBe(120);
    });

    it("gibt undefined für nicht-endliche Werte zurück", () => {
        expect(getOptionalNumber("abc")).toBeUndefined();
        expect(getOptionalNumber(Number.NaN)).toBeUndefined();
        expect(getOptionalNumber(Infinity)).toBeUndefined();
        expect(getOptionalNumber(undefined)).toBeUndefined();
    });
});

describe("isDefined", () => {
    it("erkennt undefined als nicht definiert", () => {
        expect(isDefined(undefined)).toBe(false);
    });

    it("behandelt null und 0 als definiert", () => {
        expect(isDefined(null)).toBe(true);
        expect(isDefined(0)).toBe(true);
    });

    it("filtert undefined aus einer Liste", () => {
        const input = [1, undefined, 2, undefined, 3];
        expect(input.filter(isDefined)).toEqual([1, 2, 3]);
    });
});

describe("isDefinedString", () => {
    it("erkennt Strings als definiert und undefined als nicht definiert", () => {
        expect(isDefinedString("a")).toBe(true);
        expect(isDefinedString("")).toBe(true);
        expect(isDefinedString(undefined)).toBe(false);
    });

    it("filtert undefined aus einer String-Liste", () => {
        const input: (string | undefined)[] = ["a", undefined, "b"];
        expect(input.filter(isDefinedString)).toEqual(["a", "b"]);
    });
});
