// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { createLogger } from "@open-pioneer/core";
import { NumberParserService, PackageIntl } from "@open-pioneer/runtime";
import { Coordinate } from "ol/coordinate";
import { get as getProjection, Projection, transform } from "ol/proj";
import { sourceId } from "open-pioneer:source-info";

const LOG = createLogger(sourceId);

export interface ParseSuccess {
    kind: "success";
    projection: Projection;
    coordinates: [number, number];
}

export interface ParseError {
    // Double duty as i18n message at the moment
    kind:
        | "empty"
        | "tooltip.space"
        | "tooltip.spaceOne"
        | "tooltip.2coords"
        | "tooltip.invalidNumbers"
        | "tooltip.extent"
        | "tooltip.projection";
}

export type ParseResult = ParseSuccess | ParseError;

export function parseCoordinates(
    input: string,
    numberParser: NumberParserService,
    projection: Projection
): ParseResult {
    if (input === "") return err("empty");

    if (!input.includes(" ")) {
        return err("tooltip.space");
    }
    if (input.indexOf(" ") !== input.lastIndexOf(" ")) {
        return err("tooltip.spaceOne");
    }

    const splitCoords = input.split(" ");
    if (
        splitCoords[0] == null ||
        splitCoords[1] == null ||
        splitCoords[0] === "" ||
        splitCoords[1] === ""
    ) {
        return err("tooltip.2coords");
    }

    const coordsString1 = numberParser.parseNumber(splitCoords[0]);
    const coordsString2 = numberParser.parseNumber(splitCoords[1]);

    const coords: [number, number] = [coordsString1, coordsString2];
    if (coords.some((number) => Number.isNaN(number))) {
        return err("tooltip.invalidNumbers");
    }
    try {
        if (!checkIfCoordsInProjectionsExtent(projection, coords)) {
            return err("tooltip.extent");
        }

        if (
            !checkIfCoordsInProjectionsExtent(
                getProjection("EPSG:4326"),
                transform(coords, projection, "EPSG:4326")
            )
        ) {
            return err("tooltip.extent");
        }
    } catch (e) {
        LOG.warn("Failed to check if coordinates are in projection extent", e);
        return err("tooltip.projection");
    }

    return {
        kind: "success",
        projection,
        coordinates: coords
    };
}

function err(kind: ParseError["kind"]): ParseError {
    return { kind };
}

/* validate if the coordinates fit to the extent of the selected projection */
function checkIfCoordsInProjectionsExtent(
    projection: Projection | null,
    coords: Coordinate
): boolean {
    const extent = projection?.getExtent();
    if (!extent || extent.length !== 4) {
        // Some projections don't have an extent, cannot validate.
        return true;
    }
    const [minX, minY, maxX, maxY] = extent;
    const [x, y] = coords;
    if (x == null || y == null || minX == null || minY == null || maxX == null || maxY == null) {
        throw new Error(`Internal error: invalid extent or invalid coordinates.`);
    }

    return minX <= x && minY <= y && maxX >= x && maxY >= y;
}

/* Formats the coordinates as a string with given precision considering locales */
export function formatCoordinates(
    coordinates: number[],
    precision: number,
    intl: PackageIntl
): string {
    if (coordinates[0] == null || coordinates[1] == null) {
        return "";
    }

    const [x, y] = coordinates;

    const xString = intl.formatNumber(x, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision
    });
    const yString = intl.formatNumber(y, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision
    });

    return xString + " " + yString;
}
