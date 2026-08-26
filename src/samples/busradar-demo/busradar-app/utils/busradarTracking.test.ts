// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import {
    clamp,
    clampPixelToRect,
    getBusradarTrackingBoxes,
    getBusradarUsableRect,
    getCenteredRatioRect,
    isMapPixel,
    isPixelInsideRect,
    type PixelRect
} from "./busradarTracking";

describe("isMapPixel", () => {
    it("erkennt gültige Zahlen-Tupel", () => {
        expect(isMapPixel([1, 2])).toBe(true);
        expect(isMapPixel([0, 0])).toBe(true);
    });

    it("lehnt ungültige Werte ab", () => {
        expect(isMapPixel(undefined)).toBe(false);
        expect(isMapPixel([1])).toBe(false);
        expect(isMapPixel([1, 2, 3])).toBe(false);
        expect(isMapPixel(["1", "2"])).toBe(false);
    });
});

describe("clamp", () => {
    it("begrenzt auf das Intervall", () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-3, 0, 10)).toBe(0);
        expect(clamp(42, 0, 10)).toBe(10);
    });
});

describe("isPixelInsideRect", () => {
    const rect: PixelRect = { left: 10, top: 10, right: 20, bottom: 20 };

    it("erkennt Punkte innerhalb inklusive Rand", () => {
        expect(isPixelInsideRect([15, 15], rect)).toBe(true);
        expect(isPixelInsideRect([10, 20], rect)).toBe(true);
    });

    it("erkennt Punkte außerhalb", () => {
        expect(isPixelInsideRect([9, 15], rect)).toBe(false);
        expect(isPixelInsideRect([15, 21], rect)).toBe(false);
    });
});

describe("clampPixelToRect", () => {
    it("zieht Pixel auf die Rechteckgrenzen", () => {
        const rect: PixelRect = { left: 0, top: 0, right: 100, bottom: 50 };
        expect(clampPixelToRect([120, 25], rect)).toEqual([100, 25]);
        expect(clampPixelToRect([-5, 80], rect)).toEqual([0, 50]);
        expect(clampPixelToRect([40, 30], rect)).toEqual([40, 30]);
    });
});

describe("getCenteredRatioRect", () => {
    it("zentriert ein Unterrechteck mit gegebenem Verhältnis", () => {
        const rect: PixelRect = { left: 0, top: 0, right: 100, bottom: 100 };
        expect(getCenteredRatioRect(rect, 0.5, 0.5)).toEqual({
            left: 25,
            top: 25,
            right: 75,
            bottom: 75
        });
    });
});

describe("getBusradarUsableRect", () => {
    it("nutzt schmales linkes Padding ohne aktives Panel", () => {
        const rect = getBusradarUsableRect([1000, 800], {
            leftPanelActive: false,
            overlayHeight: 0
        });
        expect(rect.left).toBe(32);
        expect(rect.top).toBe(50);
        expect(rect.right).toBe(1000 - 96);
        expect(rect.bottom).toBe(800 - 80);
    });

    it("verschiebt die linke Kante bei aktivem Panel", () => {
        const rect = getBusradarUsableRect([1000, 800], {
            leftPanelActive: true,
            overlayHeight: 0
        });
        expect(rect.left).toBe(336);
    });

    it("berücksichtigt die Overlay-Höhe für die obere Kante", () => {
        const rect = getBusradarUsableRect([1000, 800], {
            leftPanelActive: false,
            overlayHeight: 200
        });
        expect(rect.top).toBe(200 + 40);
    });
});

describe("getBusradarTrackingBoxes", () => {
    it("liefert usable/outer/inner für einen gültigen Bereich", () => {
        const boxes = getBusradarTrackingBoxes([1000, 800], {
            leftPanelActive: false,
            overlayHeight: 0
        });
        expect(boxes).toBeDefined();
        expect(boxes!.usable.left).toBe(32);
        // Innere Box ist deutlich kleiner als die äußere.
        const innerWidth = boxes!.inner.right - boxes!.inner.left;
        const outerWidth = boxes!.outer.right - boxes!.outer.left;
        expect(innerWidth).toBeLessThan(outerWidth);
    });

    it("gibt undefined für einen degenerierten Bereich zurück", () => {
        const boxes = getBusradarTrackingBoxes([50, 50], {
            leftPanelActive: true,
            overlayHeight: 400
        });
        expect(boxes).toBeUndefined();
    });
});
