// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed, ReadonlyReactive, synchronized } from "@conterra/reactivity-core";
import { PackageIntl } from "@open-pioneer/runtime";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import VectorSource from "ol/source/Vector";
import { v4 as uuid4v } from "uuid";
import {
    SelectionKind,
    SelectionOptions,
    SelectionResult,
    SelectionSourceStatusObject,
    VectorLayerSelectionSource
} from "../api";

/**
 * A SelectionSource to use an OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map).
 */
export class VectorLayerSelectionSourceImpl implements VectorLayerSelectionSource {
    readonly id: string | undefined;
    readonly label: string;
    #vectorLayer: VectorLayer<VectorSource, Feature>;
    #currentIntl: ReadonlyReactive<PackageIntl>;
    #layerVisible: ReadonlyReactive<boolean>;
    #status: ReadonlyReactive<SelectionSourceStatusObject>;

    constructor(
        id: string | undefined,
        vectorLayer: VectorLayer<VectorSource, Feature>,
        label: string,
        currentIntl: ReadonlyReactive<PackageIntl>
    ) {
        this.id = id;
        this.label = label;
        this.#vectorLayer = vectorLayer;
        this.#currentIntl = currentIntl;
        this.#layerVisible = synchronized(
            () => vectorLayer.getVisible(),
            (cb) => {
                const key = vectorLayer.on("change:visible", cb);
                return () => unByKey(key);
            }
        );
        this.#status = computed<SelectionSourceStatusObject>(() =>
            this.#layerVisible.value
                ? { kind: "available" }
                : {
                      kind: "unavailable",
                      reason: this.#currentIntl.value.formatMessage({ id: "layerNotVisibleReason" })
                  }
        );
    }

    destroy() {}

    get status() {
        return this.#status.value;
    }

    async select(
        selectionKind: SelectionKind,
        options: SelectionOptions
    ): Promise<SelectionResult[]> {
        if (selectionKind.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selectionKind.type}`);
        }

        if (this.#status.value.kind !== "available" || this.#vectorLayer.getSource() === null)
            return [];

        const allResults: SelectionResult[] = [];
        // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#vectorLayer
            .getSource()!
            .forEachFeatureIntersectingExtent(selectionKind.extent, (feature) => {
                if (!feature.getGeometry()) return;

                // TODO: Think about where to implement Date-Formatting, if the dates are already
                //  encoded as Strings...

                const filteredProperties = { ...feature.getProperties() };
                delete filteredProperties.geometries;

                const result: SelectionResult = {
                    id: feature.getId()?.toString() || uuid4v(),
                    // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
                    geometry: feature.getGeometry()!,
                    properties: filteredProperties
                };

                allResults.push(result);
            });
        const selectedFeatures = allResults.filter((s): s is SelectionResult => s != null);
        const limitedFeatures =
            selectedFeatures.length > options.maxResults
                ? selectedFeatures.slice(0, options.maxResults)
                : selectedFeatures;
        return limitedFeatures;
    }
}
