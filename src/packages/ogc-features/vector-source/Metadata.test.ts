// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from "vitest";
import { findMatchingCrs, getRequestCrs } from "./Metadata";

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

describe("getRequestCrs", () => {
    it("expect returns explicitly configured CRS", () => {
        const mapCrs = "EPSG:3857";
        const supportedCrses = [
            "http://www.opengis.net/def/crs/EPSG/0/4326",
            "http://www.opengis.net/def/crs/EPSG/0/3857"
        ];
        const configuredCrs = "http://www.opengis.net/def/crs/EPSG/0/1111";
        expect(getRequestCrs(mapCrs, supportedCrses, configuredCrs)).toBe(
            "http://www.opengis.net/def/crs/EPSG/0/1111"
        );
    });

    it("expect returns map CRS if supported", () => {
        const mapCrs = "EPSG:3857";
        const supportedCrses = [
            "http://www.opengis.net/def/crs/EPSG/0/4326",
            "http://www.opengis.net/def/crs/EPSG/0/3857"
        ];
        const configuredCrs = undefined;
        expect(getRequestCrs(mapCrs, supportedCrses, configuredCrs)).toBe(
            "http://www.opengis.net/def/crs/EPSG/0/3857"
        );
    });

    it("expect returns CRS84 if map CRS is not supported", () => {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

        const mapCrs = "EPSG:3857";
        const supportedCrses = [
            "http://www.opengis.net/def/crs/EPSG/0/4326",
            "http://www.opengis.net/def/crs/EPSG/0/1111"
        ];
        const configuredCrs = undefined;
        expect(getRequestCrs(mapCrs, supportedCrses, configuredCrs)).toBe(
            "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
        );
        expect(spy.mock.lastCall).toMatchInlineSnapshot(`
          [
            "[WARN] @open-pioneer/ogc-features/vector-source/Metadata: Map CRS 'EPSG:3857' not supported. Falling back to default CRS 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'.",
          ]
        `);
    });
});
