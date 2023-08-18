// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";

const DEFAULT_PRECISION = 4;

/**
 * Formats Ol coordinates for displaying it in the UI
 * @param {Coordinate} [coordinates]
 * @param {number | undefined} [configuredPrecision]
 * @return {string} formatted coordinates string
 */
export function useFormatting(
    coordinates: Coordinate | undefined,
    configuredPrecision: number | undefined
): string {
    const intl = useIntl();

    if (coordinates && coordinates[0] != undefined && coordinates[1] != undefined) {
        // todo transformation

        const precision = configuredPrecision || DEFAULT_PRECISION;
        const x = coordinates[0];
        const y = coordinates[1];

        const xString = intl.formatNumber(x, {
            maximumFractionDigits: precision,
            minimumFractionDigits: precision
        });
        const yString = intl.formatNumber(y, {
            maximumFractionDigits: precision,
            minimumFractionDigits: precision
        });

        const coordinatesString = xString + " " + yString;
        return coordinatesString;
    }
    return "";
}
