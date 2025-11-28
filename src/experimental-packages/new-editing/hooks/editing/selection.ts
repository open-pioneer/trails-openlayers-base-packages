// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Select } from "ol/interaction";
import { unByKey } from "ol/Observable";

import type { Feature, Map } from "ol";
import type { Layer } from "ol/layer";
import type { Options } from "ol/interaction/Select";

export function startSelectingFeature({
    map,
    layers,
    selectOptions,
    completionHandler
}: StartSelectingFeatureOptions): CleanUpAction {
    const select = new Select({ layers, hitTolerance: HIT_TOLERANCE, ...selectOptions });

    const eventsKey = select.once("select", ({ selected }) => {
        const feature = selected[0];
        if (feature != null) {
            const layer = getLayer(select, feature);
            completionHandler(feature, layer);
        }
    });

    map.addInteraction(select);

    return () => {
        unByKey(eventsKey);
        map.removeInteraction(select);
    };
}

function getLayer(select: Select, feature: Feature): Layer | undefined {
    const { featureLayerAssociation_ } = select as unknown as InternalSelect;
    const { ol_uid } = feature as InternalFeature;
    return ol_uid != null ? featureLayerAssociation_?.[ol_uid] : undefined;
}

const HIT_TOLERANCE = 22;

interface StartSelectingFeatureOptions {
    readonly map: Map;
    readonly layers: Layer[];
    readonly selectOptions: SelectOptions | undefined;
    readonly completionHandler: CompletionHandler;
}

interface InternalSelect {
    readonly featureLayerAssociation_?: Record<string, Layer>;
}

interface InternalFeature extends Feature {
    readonly ol_uid?: string;
}

export type SelectOptions = Options;

type CompletionHandler = (feature: Feature, layer: Layer | undefined) => void;
type CleanUpAction = () => void;
