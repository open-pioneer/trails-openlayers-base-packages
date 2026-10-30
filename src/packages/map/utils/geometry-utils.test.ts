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
    expect(approximatelyEquals(bufferedExtent, [843622, 6787746, 852960, 6795403], 1)).toBe(true);
});

it("should calculate a buffered extent of a given extent with custom factor", async () => {
    // [minx, miny, maxx, maxy]
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];
    const bufferedExtent = calculateBufferedExtent(extent, 2);
    expect(containsExtent(bufferedExtent, extent)).toBe(true);
    expect(approximatelyEquals(bufferedExtent, [840509, 6785194, 856073, 6797955], 1)).toBe(true);
});

it("buffers the width and the height of the extent independently", () => {
    const extent = [0, 0, 100, 10];
    const bufferedExtent = calculateBufferedExtent(extent, 2);
    expect(bufferedExtent).toEqual([-50, -5, 150, 15]);
});
