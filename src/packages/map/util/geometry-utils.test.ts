// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { it, expect } from "vitest";
import { calculateBufferedExtent } from "./geometry-utils";
import { containsExtent } from "ol/extent";

it("should calculate a buffered extent of a given extent", async () => {
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];
    const bufferedExtent = calculateBufferedExtent(extent)!;
    expect(containsExtent(bufferedExtent, extent)).toBe(true);
});

// TODO: Test custom factor
