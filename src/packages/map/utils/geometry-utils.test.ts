// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Coordinate } from "ol/coordinate";
import { approximatelyEquals, containsExtent } from "ol/extent";
import { fromLonLat, get as getOlProjection, Projection, transform } from "ol/proj";
import { beforeAll, describe, expect, it } from "vitest";
import {
    calculateBufferedExtent,
    DEFAULT_DPI,
    getPointResolution,
    getResolutionForScale,
    getScaleForPointResolution
} from "./geometry-utils";
import { registerProjections } from "./projections";

beforeAll(() => {
    registerProjections({
        "EPSG:25832":
            "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    });
});

describe("calculateBufferedExtent", () => {
    // [minx, miny, maxx, maxy], width 7782.24, height 6380.10
    const extent = [844399.851466, 6788384.425292, 852182.096409, 6794764.528497];

    it("should calculate a buffered extent of a given extent", async () => {
        const bufferedExtent = calculateBufferedExtent(extent);
        expect(containsExtent(bufferedExtent, extent)).toBe(true);

        // Default factor 1.2
        const expected = [843622, 6787746, 852960, 6795403];
        expect(approximatelyEquals(bufferedExtent, expected, 1)).toBe(true);
    });

    it("should calculate a buffered extent of a given extent with custom factor", async () => {
        const bufferedExtent = calculateBufferedExtent(extent, 2);
        expect(containsExtent(bufferedExtent, extent)).toBe(true);

        // Factor 2, so each side grows by 50% of its own dimension:
        const expected = [840509, 6785194, 856073, 6797955];
        expect(approximatelyEquals(bufferedExtent, expected, 1)).toBe(true);
    });

    it("throws for an extent that is not a rectangle", () => {
        expect(() => calculateBufferedExtent([0, 0, 1])).toThrow(/expected length 4/);
    });
});

describe("getPointResolution", () => {
    it("converts degrees to meters in EPSG:4326", () => {
        // At the equator a pixel spans one degree of arc in both directions, so the point
        // resolution is exactly `resolution * METERS_PER_DEGREE`.
        const resolution = 0.0001; // degrees per pixel
        const pointResolution = getPointResolution({
            point: [7.5, 0],
            projection: getProjection("EPSG:4326"),
            resolution
        });

        expect(pointResolution).toBeCloseTo(11.1195, 4);
    });

    it("shrinks towards the poles in EPSG:4326", () => {
        // A degree of longitude gets shorter towards the poles, a degree of latitude does not.
        // OpenLayers averages the two, so the point resolution falls off but never reaches zero.
        const projection = getProjection("EPSG:4326");
        const resolution = 0.0001;
        const atLatitude = (latitude: number) =>
            getPointResolution({ point: [7.5, latitude], projection, resolution });

        expect(atLatitude(0)).toBeCloseTo(11.1195, 4);
        expect(atLatitude(51.5)).toBeCloseTo(9.0208, 4);
        expect(atLatitude(80)).toBeCloseTo(6.5252, 4);
        expect(atLatitude(0)).toBeGreaterThan(atLatitude(51.5));
        expect(atLatitude(51.5)).toBeGreaterThan(atLatitude(80));
    });

    it.each([0, 51.5, 60, 80])(
        "equals resolution * cos(latitude) in EPSG:3857 at %s degrees north",
        (latitude) => {
            // Web Mercator inflates distances by 1 / cos(latitude), so a pixel covers
            // `resolution * cos(latitude)` meters on the ground. OpenLayers computes this
            // analytically for EPSG:3857 rather than measuring it, so it is exact.
            const resolution = 10; // meters per pixel, nominal (i.e. at the equator)
            const pointResolution = getPointResolution({
                point: fromLonLat([7.5, latitude]),
                projection: getProjection("EPSG:3857"),
                resolution
            });

            const expected = resolution * Math.cos(toRadians(latitude));
            expect(pointResolution).toBeCloseTo(expected, 9);
        }
    );
});

/**
 * The physical size of one pixel, in meters: the standardized pixel size of `0.28mm`.
 */
const PIXEL_SIZE_IN_METERS = 0.00028;

describe("getScaleForPointResolution", () => {
    it("divides the point resolution by the physical pixel size", () => {
        expect(getScaleForPointResolution({ pointResolution: 1 })).toBeCloseTo(
            1 / PIXEL_SIZE_IN_METERS, // 3571.43
            6
        );
        expect(getScaleForPointResolution({ pointResolution: 10 })).toBeCloseTo(
            10 / PIXEL_SIZE_IN_METERS, // 35714.29
            6
        );
    });

    it("returns an unrounded value", () => {
        // Rounding is a presentation concern and belongs to `MapModel.scale`, not here.
        const scale = getScaleForPointResolution({ pointResolution: 10 });
        expect(scale).not.toBe(Math.round(scale));
        expect(scale).toBeCloseTo(35714.285714, 6);
    });

    it("is proportional to the dpi", () => {
        // A denser output medium makes each pixel physically smaller, so the same ground distance
        // per pixel corresponds to a larger scale denominator.
        const pointResolution = 10;
        expect(getScaleForPointResolution({ pointResolution, dpi: DEFAULT_DPI * 2 })).toBeCloseTo(
            getScaleForPointResolution({ pointResolution }) * 2,
            6
        );
    });

    it("ensures that a pixel covering 0.28mm on the ground is scale 1:1", () => {
        const scale = getScaleForPointResolution({ pointResolution: PIXEL_SIZE_IN_METERS });
        expect(scale).toBeCloseTo(1, 9);
    });
});

/**
 * The radius of the sphere that OpenLayers' `ol/sphere` measures distances on (`DEFAULT_RADIUS`).
 * `getPointResolution()` measures the size of a pixel on *this* sphere.
 */
const OL_SPHERE_RADIUS = 6371008.8;

/** One degree of arc on that sphere, in meters: `6371008.8 * PI / 180 = 111195.08...`. */
const METERS_PER_DEGREE = (OL_SPHERE_RADIUS * Math.PI) / 180;

describe("getResolutionForScale", () => {
    it("returns meters per pixel for a metric projection", () => {
        // A pixel of 0.28mm at 1:35714.29 covers 10m on the ground, and at the equator Web
        // Mercator does not distort, so the view resolution is 10 as well.
        const resolution = getResolutionForScale({
            scale: 10 / PIXEL_SIZE_IN_METERS,
            point: fromLonLat([7.5, 0]),
            projection: getProjection("EPSG:3857")
        });

        expect(resolution).toBeCloseTo(10, 9);
    });

    it("returns degrees per pixel for EPSG:4326", () => {
        // The exact inverse of the first getPointResolution() test above.
        const resolution = getResolutionForScale({
            scale: (0.0001 * METERS_PER_DEGREE) / PIXEL_SIZE_IN_METERS,
            point: [7.5, 0],
            projection: getProjection("EPSG:4326")
        });

        expect(resolution).toBeCloseTo(0.0001, 12);
    });

    it("honours a custom dpi", () => {
        // Doubling the dpi doubles the scale denominator for a given ground resolution (see above),
        // so asking for the same scale at twice the dpi must halve the resolution.
        const options = {
            scale: 50000,
            point: [7.5, 51.5],
            projection: getProjection("EPSG:4326")
        };
        expect(getResolutionForScale({ ...options, dpi: DEFAULT_DPI * 2 })).toBeCloseTo(
            getResolutionForScale(options) / 2,
            12
        );
    });
});

/**
 * Cases that the scale computation must be correct for. Deliberately covers a metric projection with
 * an analytic point resolution (EPSG:3857), a non-metric one (EPSG:4326) and a metric one whose
 * point resolution has to be measured (EPSG:25832).
 */
const PROJECTION_CASES = [
    {
        name: "EPSG:3857 (Web Mercator, meters)",
        code: "EPSG:3857",
        point: (): Coordinate => fromLonLat([7.5, 51.5])
    },
    {
        name: "EPSG:4326 (WGS 84, degrees)",
        code: "EPSG:4326",
        point: (): Coordinate => [7.5, 51.5]
    },
    {
        name: "EPSG:4326 (WGS 84, degrees) at 60 degrees north",
        code: "EPSG:4326",
        point: (): Coordinate => [7.5, 60]
    },
    {
        name: "EPSG:25832 (UTM zone 32N, meters)",
        code: "EPSG:25832",
        point: (): Coordinate => transform([9, 51.5], "EPSG:4326", "EPSG:25832")
    }
];

/** Smallest, two intermediate and largest of the scale-setter defaults. */
const ROUND_TRIP_SCALES = [2132, 34123, 545978, 17471320];

/** The default scales of the `@open-pioneer/scale-setter` package, just to get some sensible test values scales. */
const SCALE_VALUES = [
    17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061, 8530,
    4265, 2132
];

describe("scale round trip", () => {
    describe.each(PROJECTION_CASES)("$name", ({ code, point }) => {
        it.each(ROUND_TRIP_SCALES)("round trips scale 1:%i without significant error", (scale) => {
            const relativeError = Math.abs(
                roundTripScale(scale, point(), getProjection(code)) / scale - 1
            );
            expect(relativeError).toBeCloseTo(0, 7);
        });
    });

    it("round trips scale-setter default scale", () => {
        // This is the user visible contract: picking 1:17,471,320 in the scale setter must show
        // 1:17,471,320 again, not 1:17,471,372.
        const point: Coordinate = [7.5, 51.5];
        const projection = getProjection("EPSG:4326");
        const displayed = SCALE_VALUES.map((scale) =>
            Math.round(roundTripScale(scale, point, projection))
        );

        expect(displayed).toEqual(SCALE_VALUES);
    });
});

function roundTripScale(scale: number, point: Coordinate, projection: Projection): number {
    const resolution = getResolutionForScale({ scale, point, projection });
    return getScaleForPointResolution({
        pointResolution: getPointResolution({ point, projection, resolution })
    });
}

function getProjection(code: string): Projection {
    const projection = getOlProjection(code);
    if (!projection) {
        throw new Error(`Test setup error: projection '${code}' is not registered.`);
    }
    return projection;
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}
