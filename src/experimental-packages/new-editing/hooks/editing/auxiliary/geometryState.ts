// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Coordinate } from "ol/coordinate";
import type { Geometry, LineString, Polygon } from "ol/geom";

export function canBeFinished(
    geometry: Geometry,
    numberOfVertices: number | undefined
): boolean | undefined {
    if (isLineString(geometry) && numberOfVertices != null) {
        return numberOfVertices >= 3;
    } else if (isPolygon(geometry) && numberOfVertices != null) {
        return numberOfVertices >= 4;
    } else {
        return undefined;
    }
}

export function canBeAborted(
    geometry: Geometry,
    numberOfVertices: number | undefined
): boolean | undefined {
    if ((isLineString(geometry) || isPolygon(geometry)) && numberOfVertices != null) {
        return numberOfVertices >= 1;
    } else {
        return undefined;
    }
}

export function getNumberOfVertices(geometry: Geometry): number | undefined {
    if (isLineString(geometry)) {
        return geometry.getCoordinates().length;
    } else if (isPolygon(geometry)) {
        return geometry.getFlatCoordinates().length / 2 - 1;
    } else {
        return undefined;
    }
}

export function getLastCoordinate(geometry: Geometry): Coordinate | undefined {
    if (isLineString(geometry)) {
        const lastCoordinate = geometry.getLastCoordinate();
        return lastCoordinate.length >= 2 ? lastCoordinate : undefined;
    } else if (isPolygon(geometry)) {
        const coordinates = geometry.getLinearRing(0)?.getCoordinates();
        return coordinates?.[coordinates.length - 2] ?? undefined;
    } else {
        return undefined;
    }
}

function isLineString(geometry: Geometry): geometry is LineString {
    return geometry.getType() === "LineString";
}

function isPolygon(geometry: Geometry): geometry is Polygon {
    return geometry.getType() === "Polygon";
}
