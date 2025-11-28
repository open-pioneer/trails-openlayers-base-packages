// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageIntl } from "@open-pioneer/runtime";
import type { CoordinateViewerProps } from "./CoordinateViewer";

const DEFAULT_PRECISION = 4;
const DEFAULT_DISPLAY_FORMAT = "decimal";

export function formatCoordinates(
    coordinates: number[],
    configuredPrecision: number | undefined,
    intl: PackageIntl,
    configuredFormat: CoordinateViewerProps["format"]
) {
    if (coordinates[0] == null || coordinates[1] == null) {
        return "";
    }

    const precision = configuredPrecision ?? DEFAULT_PRECISION;
    const format = configuredFormat ?? DEFAULT_DISPLAY_FORMAT;
    const [x, y] = coordinates;

    let str;
    if (format === "degree" && isFinite(x) && isFinite(y)) {
        const [xHour, xMin, xSek] = toDegree(x, intl, precision);
        const [yHour, yMin, ySek] = toDegree(y, intl, precision);

        const xString = `${Math.abs(xHour)}°${xMin}'${xSek}"${0 <= xHour ? "(E)" : "(W)"}`;
        const yString = `${Math.abs(yHour)}°${yMin}'${ySek}"${0 <= yHour ? "(N)" : "(S)"}`;

        str = xString + " " + yString;
    } else {
        const xString = intl.formatNumber(x, {
            maximumFractionDigits: precision,
            minimumFractionDigits: precision
        });
        const yString = intl.formatNumber(y, {
            maximumFractionDigits: precision,
            minimumFractionDigits: precision
        });
        str = xString + " " + yString;
    }
    return str;
}

function toDegree(
    coordPart: number,
    intl: PackageIntl,
    precision: number
): [number, number, string] {
    const cHour = Math.floor(coordPart);
    const cNach = coordPart - cHour;

    const cMin = Math.floor(60 * cNach);
    const cMinNach = 60 * cNach - cMin;

    const cSek = 60 * cMinNach;
    const cSekRounded = intl.formatNumber(cSek, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision
    });

    return [cHour, cMin, cSekRounded];
}
