// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SelectionResult,
    SelectionOptions,
    SelectionSourceStatus,
    SelectionKind,
    VectorLayerSelectionSource,
    SelectionSourceStatusObject
} from "./api";
import VectorLayer from "ol/layer/Vector";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { v4 as uuid4v } from "uuid";
import Feature from "ol/Feature";
import { reactive } from "@conterra/reactivity-core";
import VectorSource from "ol/source/Vector";

/**
 * A SelectionSource to use an OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map).
 * Features are:
 * -   using only the extent as selection kind
 * -   listening to layer visibility changes and updating the status of the source
 * -   limiting the number of returned selection results to the corresponding selection option
 * -   throwing an event `changed:status` when the status updates
 */
export class VectorLayerSelectionSourceImpl implements VectorLayerSelectionSource {
    readonly label: string;
    #status = reactive<SelectionSourceStatusObject>({ kind: "available" });
    #vectorLayer: VectorLayer<VectorSource, Feature>;
    #eventHandler: EventsKey;
    #layerNotVisibleReason: string;

    constructor(
        vectorLayer: VectorLayer<VectorSource, Feature>,
        label: string,
        layerNotVisibleReason: string
    ) {
        this.label = label;
        this.#vectorLayer = vectorLayer;
        this.#layerNotVisibleReason = layerNotVisibleReason;
        this.#updateStatus();
        this.#eventHandler = this.#vectorLayer.on("change:visible", () => {
            this.#updateStatus();
        });
    }

    destroy() {
        unByKey(this.#eventHandler);
    }

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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

    #updateStatus() {
        const layerIsVisible = this.#vectorLayer.getVisible();
        const newStatus: SelectionSourceStatus = layerIsVisible
            ? { kind: "available" }
            : { kind: "unavailable", reason: this.#layerNotVisibleReason };
        if (newStatus.kind !== this.#status.value.kind) {
            this.#status.value = newStatus;
        }
    }
}
