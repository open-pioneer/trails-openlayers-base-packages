// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Select } from "ol/interaction";
import { unByKey } from "ol/Observable";

import type { Feature } from "ol";
import type { EventsKey } from "ol/events";
import type { Options } from "ol/interaction/Select";
import type { Layer } from "ol/layer";

import { BaseInteraction } from "../base/BaseInteraction";

export class SelectionInteraction extends BaseInteraction<SelectionOptions, SelectionData> {
    protected override startInteraction(options: SelectionOptions): SelectionData {
        const { layers, selectOptions, completionHandler } = options;

        const select = new Select({
            layers,
            hitTolerance: SelectionInteraction.DEFAULT_HIT_TOLERANCE,
            ...selectOptions
        });

        const eventsKey = select.once("select", ({ selected }) => {
            const feature = selected[0];
            if (feature != null) {
                const layer = this.getLayer(select, feature);
                completionHandler(feature, layer);
            }
        });

        this.map.addInteraction(select);

        return { select, eventsKey };
    }

    protected override stopInteraction({ select, eventsKey }: SelectionData): void {
        unByKey(eventsKey);
        this.map.removeInteraction(select);
    }

    private getLayer(select: Select, feature: Feature): Layer | undefined {
        const { featureLayerAssociation_ } = select as unknown as InternalSelect;
        const { ol_uid } = feature as InternalFeature;
        return ol_uid != null ? featureLayerAssociation_?.[ol_uid] : undefined;
    }

    private static readonly DEFAULT_HIT_TOLERANCE = 22;
}

export interface SelectionOptions {
    readonly layers: Layer[];
    readonly selectOptions?: SelectOptions;
    readonly completionHandler: (feature: Feature, layer: Layer | undefined) => void;
}

export type SelectOptions = Omit<Options, "layers">;

interface SelectionData {
    readonly select: Select;
    readonly eventsKey: EventsKey;
}

interface InternalSelect {
    readonly featureLayerAssociation_?: Record<string, Layer>;
}

interface InternalFeature extends Feature {
    readonly ol_uid?: string;
}
