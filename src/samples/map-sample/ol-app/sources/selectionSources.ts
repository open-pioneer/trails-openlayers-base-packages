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
    #status: SelectionSourceStatus;
    #vectorLayer: VectorLayer<VectorSource>;

    constructor(
        vectorLayer: VectorLayer<VectorSource>,
        label: string,
        status?: SelectionSourceStatus
    ) {
        super();
        this.#status = status || "unavailable";
        this.label = label;
        this.#vectorLayer = vectorLayer;
    }

    get status(): SelectionSourceStatus {
        return this.#status;
    }

    set status(value: SelectionSourceStatus) {
        if (value !== this.#status) {
            this.#status = value;
            this.emit("changed:status");
        }
    }

    async select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]> {
        if (selection.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selection.type}`);
        }

        if (this.#status !== "available" || this.#vectorLayer.getSource() === null) return [];

        const allResults = this.#vectorLayer
            .getSource()!
            .getFeaturesInExtent(selection.extent, options.mapProjection)
            .map((feature, index) => {
                if (!feature.getGeometry()) return undefined;
                const result: SelectionResult = {
                    id: index,
                    geometry: feature.getGeometry()!
                };
                return result;
            });

        const selectedFeatures = allResults.filter((s): s is SelectionResult => s != null);
        const limitedFeatures =
            selectedFeatures.length > options.maxResults
                ? selectedFeatures.slice(0, options.maxResults)
                : selectedFeatures;
        return limitedFeatures;
    }
}
