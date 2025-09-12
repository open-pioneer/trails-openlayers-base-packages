// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { approximatelyEquals, containsExtent } from "ol/extent";
import { expect, it } from "vitest";
import { calculateBufferedExtent } from "./geometry-utils";

it("should calculate a buffered extent of a given extent", async () => {
    // [minx, miny, maxx, maxy]
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];
    const bufferedExtent = calculateBufferedExtent(extent);
    expect(containsExtent(bufferedExtent, extent)).toBe(true);
    expect(approximatelyEquals(bufferedExtent, [843761, 6787606, 852820, 6795542], 1)).toBe(true);
});

it("should calculate a buffered extent of a given extent with custom factor", async () => {
    // [minx, miny, maxx, maxy]
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];
    const bufferedExtent = calculateBufferedExtent(extent, 2);
    expect(containsExtent(bufferedExtent, extent)).toBe(true);
    expect(approximatelyEquals(bufferedExtent, [841209, 6784493, 855372, 6798655], 1)).toBe(true);
});
