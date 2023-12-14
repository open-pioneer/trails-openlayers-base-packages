// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SelectionSource,
    SelectionResult,
    SelectionOptions,
    SelectionSourceStatus,
    SelectionSourceEvents,
    SelectionKind
} from "./api";
import { Point } from "ol/geom";
import { EventEmitter } from "@open-pioneer/core";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { EventsKey } from "ol/events";

export const fakeSelectedPointFeatures = [
    new Point([407354, 5754673]), // con terra (Bottom Right)
    new Point([404740, 5757893]) // Schloss (Top Left)
];

let count = 0;

export class FakePointSelectionSource
    extends EventEmitter<SelectionSourceEvents>
    implements SelectionSource
{
    readonly label = `Fake Selection Source #${++count}`;
    #timeout: number;
    #status: SelectionSourceStatus;
    #pointFeatures: Point[];

    constructor(
        timeout?: number,
        status?: SelectionSourceStatus,
        pointFeatures: Point[] = fakeSelectedPointFeatures
    ) {
        super();
        this.#timeout = timeout || 0;
        this.#status = status || "unavailable";
        this.#pointFeatures = pointFeatures;
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

        if (this.#status !== "available") return [];

        await new Promise((resolve) => setTimeout(resolve, this.#timeout));

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
    #eventHandler: EventsKey;

    constructor(vectorLayer: VectorLayer<VectorSource>, label: string) {
        super();
        this.#status = vectorLayer.getVisible() ? "available" : "unavailable";
        this.label = label;
        this.#vectorLayer = vectorLayer;
        this.#eventHandler = this.#vectorLayer.on("change:visible", () => {
            this.status = this.#vectorLayer.getVisible() ? "available" : "unavailable";
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