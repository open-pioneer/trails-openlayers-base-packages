// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Snap } from "ol/interaction";
import type { Vector as VectorSource } from "ol/source";

import { BaseInteraction } from "../base/BaseInteraction";
import type { SnappingOptions } from "../../../../api/model/InteractionOptions";

export class SnappingInteraction extends BaseInteraction<SnappingParameters, SnappingData> {
    protected override startInteraction(parameters: SnappingParameters): SnappingData {
        const { snappingSources, snappingOptions } = parameters;

        const snaps = snappingSources.map((source) => new Snap({ source, ...snappingOptions }));

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

export interface SnappingParameters {
    readonly snappingSources: VectorSource[];
    readonly snappingOptions?: SnappingOptions;
}

interface SnappingData {
    readonly snaps: Snap[];
}
