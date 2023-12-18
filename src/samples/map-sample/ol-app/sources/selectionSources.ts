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
import { Point } from "ol/geom";
import { EventEmitter } from "@open-pioneer/core";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { EventsKey } from "ol/events";

export const fakeSelectedPointFeatures = [
    new Point([407354, 5754673]), // con terra (Bottom Right)
    new Point([404740, 5757893]) // Schloss (Top Left)
];

export class FakePointSelectionSource implements SelectionSource {
    readonly label: string;
    readonly status: SelectionSourceStatus;
    #pointFeatures: Point[];

    constructor(
        label: string,
        status?: SelectionSourceStatus,
        pointFeatures: Point[] = fakeSelectedPointFeatures
    ) {
        this.label = label;
        this.status = status ?? "unavailable";
        this.#pointFeatures = pointFeatures;
    }

    async select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {
        if (selection.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selection.type}`);
        }

        if (this.status !== "available") return [];

        const allPoints = this.#pointFeatures.map((point, index) => {
            const result: SelectionResult = {
                id: index,
                geometry: point
            };
            if (!point.intersectsExtent(selection.extent)) {
                return undefined;
            }
            return result;
        });

        const selectedPoints = allPoints.filter((s): s is SelectionResult => s != null);
        const limitedResults =
            selectedPoints.length > options.maxResults
                ? selectedPoints.slice(0, options.maxResults)
                : selectedPoints;
        return limitedResults;
    }
}

export class VectorLayerSelectionSource
    extends EventEmitter<SelectionSourceEvents>
    implements SelectionSource
{
    readonly label: string;
    #status: SelectionSourceStatus = "available";
    #vectorLayer: VectorLayer<VectorSource>;
    #eventHandler: EventsKey;

    #unavailableStatusReason: string | undefined;
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
        this.updateStatus();
        this.#eventHandler = this.#vectorLayer.on("change:visible", () => {
            this.updateStatus();
        });
    }

    destroy() {
        // TODO: Is this the correct way to remove the listener?
        this.#vectorLayer.removeChangeListener(
            this.#eventHandler.type,
            this.#eventHandler.listener
        );
    }

    get status(): SelectionSourceStatus {
        return this.#status;
    }

    get unavailableStatusReason(): string | undefined {
        return this.#unavailableStatusReason;
    }

    private updateStatus() {
        const layerIsVisible = this.#vectorLayer.getVisible();
        const newStatus = layerIsVisible ? "available" : "unavailable";
        if (newStatus !== this.#status) {
            this.#status = newStatus;
            this.#unavailableStatusReason = layerIsVisible
                ? undefined
                : this.#layerNotVisibleReason;
            this.emit("changed:status");
        }
    }

    async select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {
        if (selection.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selection.type}`);
        }

        if (this.#status !== "available" || this.#vectorLayer.getSource() === null) return [];

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
}
