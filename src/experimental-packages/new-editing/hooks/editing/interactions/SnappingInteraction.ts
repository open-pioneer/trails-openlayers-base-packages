// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Snap } from "ol/interaction";
import type { Vector as VectorSource } from "ol/source";
import type { Options } from "ol/interaction/Snap";

import { BaseInteraction } from "../base/BaseInteraction";

export class SnappingInteraction extends BaseInteraction<SnappingOptions, SnappingData> {
    protected override startInteraction(options: SnappingOptions): SnappingData {
        const { snappingSources, snapOptions } = options;

        const snaps = snappingSources.map((source) => new Snap({ source, ...snapOptions }));

        for (const snap of snaps) {
            this.map.addInteraction(snap);
        }

        return { snaps };
    }

    protected override stopInteraction({ snaps }: SnappingData): void {
        for (const snap of snaps) {
            this.map.removeInteraction(snap);
        }
    }
}

export interface SnappingOptions {
    readonly snappingSources: VectorSource[];
    readonly snapOptions?: SnapOptions;
}

export type SnapOptions = Omit<Options, "features" | "source">;

interface SnappingData {
    readonly snaps: Snap[];
}
