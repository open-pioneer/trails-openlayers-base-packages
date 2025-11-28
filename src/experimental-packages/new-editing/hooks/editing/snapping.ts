// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Snap } from "ol/interaction";
import type { Map } from "ol";
import type { Vector as VectorSource } from "ol/source";
import type { Options } from "ol/interaction/Snap";

export function startSnapping({
    map,
    snappingSources,
    snapOptions
}: StartSnappingOptions): CleanUpAction {
    const snaps = snappingSources.map((source) => new Snap({ source, ...snapOptions }));

    for (const snap of snaps) {
        map.addInteraction(snap);
    }

    return () => {
        for (const snap of snaps) {
            map.removeInteraction(snap);
        }
    };
}

export interface StartSnappingOptions {
    readonly map: Map;
    readonly snappingSources: VectorSource[];
    readonly snapOptions: SnapOptions | undefined;
}

export type SnapOptions = Omit<Options, "features" | "source">;

type CleanUpAction = () => void;
