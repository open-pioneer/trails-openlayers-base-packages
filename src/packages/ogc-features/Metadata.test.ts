// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { findMatchingCrs } from "./Metadata";

describe("findMatchingCrs", () => {
    it("matches an EPSG code against its equivalent OGC CRS URI", () => {
        const available = ["http://www.opengis.net/def/crs/EPSG/0/4326"];
        findMatchingCrs("EPSG:4326", available);
        expect(findMatchingCrs("EPSG:4326", available)).toBe(
            "http://www.opengis.net/def/crs/EPSG/0/4326"
        );
    });
});
