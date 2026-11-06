// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Coordinate } from "ol/coordinate";
import { Extent, getHeight, getWidth } from "ol/extent";
import { Projection, getPointResolution as getOlPointResolution } from "ol/proj";

const DEFAULT_BUFFER_FACTOR = 1.2;

/**
 * Computes a buffered extent using the given original extent.
 *
 * Use the `factor` (`1.2` by default) to specify the size increase.
 *
 * @group Utilities
 */
export function calculateBufferedExtent(extent: Extent, factor = DEFAULT_BUFFER_FACTOR): Extent {
    checkExtent(extent);

    // The extent grows by `factor` in both dimensions, so each side moves by half of the growth.
    const xPadding = (getWidth(extent) * (factor - 1)) / 2;
    const yPadding = (getHeight(extent) * (factor - 1)) / 2;
    return [extent[0] - xPadding, extent[1] - yPadding, extent[2] + xPadding, extent[3] + yPadding];
}

function checkExtent(extent: Extent): asserts extent is [number, number, number, number] {
    if (extent.length !== 4) {
        throw new Error(`Invalid extent (expected length 4, but got length ${extent.length}).`);
    }
}

const INCHES_PER_METRE = 1000 / 25.4;

/**
 * The default pixel density used when converting between scale and resolution, in _pixels per inch_.
 *
 * The value (`≈ 90.71`) follows from the standardized pixel size of `0.28mm` mandated by the OGC WMS
 * and SLD specifications: `25.4mm per inch / 0.28mm per pixel`. It is also the value OpenLayers uses.
 *
 * This is the default `dpi` of {@link getScaleForPointResolution} and {@link getResolutionForScale}.
 *
 * @group Utilities
 */
export const DEFAULT_DPI = 25.4 / 0.28;

/**
 * Returns the _point resolution_ in _meters per pixel_ at the given `point`.
 *
 * The `resolution` must be given as a _view resolution_, i.e. in _projection units per pixel_
 * (as returned by OpenLayers' `View.getResolution()` or `MapModel.resolution`).
 *
 * The result generally differs from the given `resolution`, for two reasons:
 *
 * - the projection's unit may not be the meter (e.g. `EPSG:4326` uses degrees);
 * - the projection's local scale factor varies depending on the specific coordinate
 *
 * @group Utilities
 */
export function getPointResolution(options: {
    point: Coordinate;
    projection: Projection;
    resolution: number;
}): number {
    const { point, projection, resolution } = options;
    return getOlPointResolution(projection, resolution, point, "m");
}

/**
 * Computes the map scale for the given `pointResolution` (in _meters per pixel_).
 *
 * The point resolution is typically derived from the map's center, its projection and its view
 * resolution, see {@link getPointResolution}.
 *
 * Note that the returned scale is the _denominator_ of the map's scale, i.e. `1:${scale}`.
 *
 * > NOTE: The value is not rounded.
 *
 * See also OpenLayers' `getScaleForResolution()`:
 * https://github.com/openlayers/openlayers/blob/7fa9df03431e9e1bc517e6c414565d9f848a3132/src/ol/control/ScaleLine.js#L454C3-L454C24
 *
 * @group Utilities
 */
export function getScaleForPointResolution(options: {
    pointResolution: number;
    dpi?: number;
}): number {
    const {
        pointResolution,
        dpi = DEFAULT_DPI // pixels per inch
    } = options;
    const pixelsPerMeter = dpi * INCHES_PER_METRE;
    return pointResolution * pixelsPerMeter;
}

/**
 * Computes the _view resolution_ (in _projection units per pixel_) needed to display the map at the
 * given `scale` around the given `point`.
 *
 * This is the inverse of {@link getScaleForPointResolution} combined with {@link getPointResolution}:
 * feeding the result back through those two functions returns `scale` again.
 *
 * @group Utilities
 */
export function getResolutionForScale(options: {
    scale: number;
    point: Coordinate;
    projection: Projection;
    dpi?: number;
}): number {
    const {
        scale,
        point,
        projection,
        dpi = DEFAULT_DPI // pixels per inch
    } = options;
    const pixelsPerMeter = dpi * INCHES_PER_METRE;

    // First estimate, using the projection's _nominal_ meters per unit.
    // This ignores the projection's local scale factor at `point`, so it can be considerably off.
    const estimate = scale / (pixelsPerMeter * (projection.getMetersPerUnit() ?? 1));
    // Correct the estimate using the meters per unit actually measured at that estimate.
    const metersPerUnit =
        getPointResolution({ point, projection, resolution: estimate }) / estimate;
    return scale / (pixelsPerMeter * metersPerUnit);
}
