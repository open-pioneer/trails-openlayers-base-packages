// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from "vitest";
import { findMatchingCrs } from "./Metadata";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("findMatchingCrs", () => {
    it("expect EPSG code matches its equivalent OGC CRS URI", () => {
        const available = ["http://www.opengis.net/def/crs/EPSG/0/4326"];
        expect(findMatchingCrs("EPSG:4326", available)).toBe(
            "http://www.opengis.net/def/crs/EPSG/0/4326"
        );
    });
    it("expect EPSG code does not match non-equivalent OGC CRS URI", () => {
        const available = ["http://www.opengis.net/def/crs/EPSG/0/1111"];
        expect(findMatchingCrs("EPSG:4326", available)).toBe(undefined);
    });

    it("expect OGC CRS URI matches same OGC CRS URI", () => {
        const available = ["http://www.opengis.net/def/crs/EPSG/0/4326"];
        expect(findMatchingCrs("http://www.opengis.net/def/crs/EPSG/0/4326", available)).toBe(
            "http://www.opengis.net/def/crs/EPSG/0/4326"
        );
    });

    it("expect returns undefined on no available CRSes", () => {
        const emptyAvailableCRS: string[] = [];
        expect(
            findMatchingCrs("http://www.opengis.net/def/crs/EPSG/0/4326", emptyAvailableCRS)
        ).toBe(undefined);
    });

    it("expect returns undefined on no available CRSes", () => {
        const noAvailableCRS = undefined;
        expect(findMatchingCrs("http://www.opengis.net/def/crs/EPSG/0/4326", noAvailableCRS)).toBe(
            undefined
        );
    });
});


