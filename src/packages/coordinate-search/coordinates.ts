// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageIntl } from "@open-pioneer/runtime";
import { get as getProjection, Projection, transform } from "ol/proj";
import { createLogger } from "@open-pioneer/core";
const LOG = createLogger("coordinate-search");

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
        | "tooltip.dividerDe"
        | "tooltip.dividerEn"
        | "tooltip.extent"
        | "tooltip.projection";
}

export type ParseResult = ParseSuccess | ParseError;

export function parseCoordinates(
    input: string,
    locale: string,
    projection: Projection
): ParseResult {
    if (input == "") return err("empty");

    if (!input.includes(" ")) {
        return err("tooltip.space");
    }
    if (input.indexOf(" ") != input.lastIndexOf(" ")) {
        return err("tooltip.spaceOne");
    }

    const coordsString = input.split(" ");
    if (coordsString.length != 2 || coordsString[0] == "" || coordsString[1] == "") {
        return err("tooltip.2coords");
    }

    // TODO: use NumberParser from core
    let thousandSeparator = "";
    if (/^de-?/.test(locale)) {
        thousandSeparator = ".";

        const inputStringWithoutThousandSeparator = input.replaceAll(thousandSeparator, "");

        if (!/^-?\d+(,\d+)? -?\d+(,\d+)?$/.test(inputStringWithoutThousandSeparator)) {
            return err("tooltip.dividerDe");
        }
    } else if (/en-?/.test(locale)) {
        thousandSeparator = ",";

        const inputStringWithoutThousandSeparator = input.replaceAll(thousandSeparator, "");

        if (!/^-?\d+(.\d+)? -?\d+(.\d+)?$/.test(inputStringWithoutThousandSeparator)) {
            return err("tooltip.dividerEn");
        }
    }

    const coords = parseCoords(input, locale);
    try {
        if (!checkIfCoordsInProjectionsExtent(projection, coords)) {
            return err("tooltip.extent");
        }

        if (
            !checkIfCoordsInProjectionsExtent(
                getProjection("EPSG:4326")!,
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

// TODO: use NumberParser from core
/* transforms the given coordinates to the given destination projection */
function parseCoords(inputString: string, locale: string): [number, number] {
    const separator = /^de-?/.test(locale) ? "." : /^en-?/.test(locale) ? "," : "";
    const inputStringWithoutThousandSeparator = inputString.replaceAll(separator, "");

    const coordsString = inputStringWithoutThousandSeparator.replaceAll(",", ".");

    const splitCoords = coordsString.split(" ");
    return [parseFloat(splitCoords[0]!), parseFloat(splitCoords[1]!)];
}

/* validate if the coordinates fit to the extent of the selected projection */
function checkIfCoordsInProjectionsExtent(projection: Projection, coords: number[]): boolean {
    const extent = projection.getExtent();
    if (!extent || extent.length !== 4) {
        // Some projections don't have an extent, cannot validate.
        return true;
    }
    if (!coords || coords.length !== 2) {
        throw new Error(`Internal error: invalid coordinates ${coords}.`);
    }

    return (
        extent[0]! <= coords[0]! &&
        extent[1]! <= coords[1]! &&
        extent[2]! >= coords[0]! &&
        extent[3]! >= coords[1]!
    );
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
