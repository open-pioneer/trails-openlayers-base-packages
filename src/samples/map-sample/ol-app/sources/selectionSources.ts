// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SelectionSource,
    SelectionResult,
    SelectionOptions,
    SelectionSourceStatus,
    SelectionKind,
    SelectionSourceEvents
} from "@open-pioneer/selection";
import { EventEmitter } from "@open-pioneer/core";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

export class VectorLayerSelectionSource
    extends EventEmitter<SelectionSourceEvents>
    implements SelectionSource
{
    readonly label: string;
    #status: Exclude<SelectionSourceStatus, string> = { kind: "available" };
    #vectorLayer: VectorLayer<VectorSource>;
    #eventHandler: EventsKey;
    #layerNotVisibleReason: string;

    constructor(
        vectorLayer: VectorLayer<VectorSource>,
        label: string,
        layerNotVisibleReason: string
    ) {
        super();
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

    get status(): Exclude<SelectionSourceStatus, string> {
        return this.#status;
    }

    async select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {
        if (selection.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selection.type}`);
        }

        if (this.#status.kind !== "available" || this.#vectorLayer.getSource() === null) return [];

        const allResults: SelectionResult[] = [];
        this.#vectorLayer
            .getSource()!
            .forEachFeatureIntersectingExtent(selection.extent, (feature) => {
                if (!feature.getGeometry()) return;
                const result: SelectionResult = {
                    id: feature.getId()?.toString() || feature.getGeometry.toString(),
                    geometry: feature.getGeometry()!
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
        if (newStatus.kind !== this.#status.kind) {
            this.#status = newStatus;
            this.emit("changed:status");
        }
    }
}
