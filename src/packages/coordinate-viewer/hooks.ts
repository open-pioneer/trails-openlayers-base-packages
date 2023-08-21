// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0

import Map from "ol/Map.js";
import { Coordinate } from "ol/coordinate";
import { useIntl } from "open-pioneer:react-hooks";
import { Projection } from "ol/proj";
import { useEffect, useState } from "react";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

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
        // improvement: allow transformation into another coordinate system

        const precision = configuredPrecision ?? DEFAULT_PRECISION;
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

/**
 * Detect change of map and return projection | null
 */
export function useProjection(map: Map | undefined): { projection: Projection | null } {
    // todo refactor into "map helpers" package
    const [projection, setProjection] = useState<Projection | null>(null);

    useEffect(() => {
        if (!map) {
            return;
        }

        // set initial map projection
        setProjection(map.getView().getProjection());

        const eventsKey: EventsKey = map.on("change:view", () => {
            const newProjection = map.getView().getProjection();

            if (projection != newProjection) {
                setProjection(newProjection);
            }
        });

        return () => unByKey(eventsKey);
    }, [map, projection]);

    return { projection };
}
