// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Coordinate } from "ol/coordinate";
import type { Geometry, LineString, Polygon } from "ol/geom";

export function canBeFinished(geometry: Geometry, numberOfVertices: number): boolean | null {
    if (isLineString(geometry)) {
        return numberOfVertices >= 3;
    } else if (isPolygon(geometry)) {
        return numberOfVertices >= 4;
    } else {
        return null;
    }
}

export function canBeAborted(geometry: Geometry, numberOfVertices: number): boolean | null {
    if (isLineString(geometry) || isPolygon(geometry)) {
        return numberOfVertices >= 1;
    } else {
        return null;
    }
}

export function getNumberOfVertices(geometry: Geometry): number | null {
    if (isLineString(geometry)) {
        return geometry.getCoordinates().length;
    } else if (isPolygon(geometry)) {
        return geometry.getFlatCoordinates().length / 2 - 1;
    } else {
        return null;
    }
}

export function getLastCoordinate(geometry: Geometry): Coordinate | null {
    if (isLineString(geometry)) {
        const lastCoordinate = geometry.getLastCoordinate();
        return lastCoordinate.length >= 2 ? lastCoordinate : null;
    } else if (isPolygon(geometry)) {
        const coordinates = geometry.getLinearRing(0)?.getCoordinates();
        return coordinates?.[coordinates.length - 2] ?? null;
    } else {
        return null;
    }
}

function isLineString(geometry: Geometry): geometry is LineString {
    return geometry.getType() === "LineString";
}

function isPolygon(geometry: Geometry): geometry is Polygon {
    return geometry.getType() === "Polygon";
}
