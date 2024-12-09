// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Coordinate } from "ol/coordinate";
import { Projection, transform } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { useMemo } from "react";
import { ProjectionItem } from "./CoordinateInput";
import { formatCoordinates } from "./coordinates";

/**
 * Returns the current placeholder string.
 */
//In a different file for HMR.
export function usePlaceholder(
    placeholderProp: string | Coordinate,
    mapProjection: Projection | undefined,
    selectedProjection: ProjectionItem
) {
    const intl = useIntl();

    return useMemo(() => {
        let placeholder: string;
        if (typeof placeholderProp === "string") {
            placeholder = placeholderProp;
        } else if (!mapProjection) {
            placeholder = "";
        } else {
            const coords = transform(
                placeholderProp as Coordinate,
                mapProjection,
                selectedProjection.value
            );
            placeholder = formatCoordinates(coords, selectedProjection.precision, intl);
        }
        return placeholder;
    }, [placeholderProp, mapProjection, selectedProjection, intl]);
}
