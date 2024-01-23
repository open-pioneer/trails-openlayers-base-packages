// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SelectionSource,
    SelectionResult,
    SelectionOptions,
    SelectionSourceStatus,
    SelectionSourceEvents,
    SelectionKind,
    VectorLayerSelectionSource
} from "./api";
import { Point } from "ol/geom";
import { EventEmitter } from "@open-pioneer/core";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { v4 as uuid4v } from "uuid";

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

    async select(
        selectionKind: SelectionKind,
        options: SelectionOptions
    ): Promise<SelectionResult[]> {
        if (selectionKind.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selectionKind.type}`);
        }

        if (this.#status !== "available") return [];

        await new Promise((resolve) => setTimeout(resolve, this.#timeout));

        const allPoints = this.#pointFeatures.map((point, index) => {
            const result: SelectionResult = {
                id: index,
                geometry: point
            };
            if (!point.intersectsExtent(selectionKind.extent)) {
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

/**
 * A SelectionSource to use an OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map).
 * Features are:
 * -   using only the extent as selection kind
 * -   listening to layer visibility changes and updating the status of the source
 * -   limiting the number of returned selection results to the corresponding selection option
 * -   throwing an event `changed:status` when the status updates
 */
export class VectorLayerSelectionSourceImpl
    extends EventEmitter<SelectionSourceEvents>
    implements VectorLayerSelectionSource
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

    get status() {
        return this.#status;
    }

    async select(
        selectionKind: SelectionKind,
        options: SelectionOptions
    ): Promise<SelectionResult[]> {
        if (selectionKind.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selectionKind.type}`);
        }

        if (this.#status.kind !== "available" || this.#vectorLayer.getSource() === null) return [];

        const allResults: SelectionResult[] = [];
        this.#vectorLayer
            .getSource()!
            .forEachFeatureIntersectingExtent(selectionKind.extent, (feature) => {
                if (!feature.getGeometry()) return;
                const someAttrs = feature
                    .getKeys()
                    .slice(0)
                    .filter((item) => item !== "geometry" && !item.includes("."));

                const filterdProps: Record<string, unknown> = {};

                someAttrs.forEach((item: string) => {
                    filterdProps[item as keyof SelectionResult] = feature.getProperties()[item];
                });

                const result: SelectionResult = {
                    id: feature.getId()?.toString() || uuid4v(),
                    geometry: feature.getGeometry()!,
                    properties: filterdProps
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

/**
 * For testing purposes only
 */
export class NoStatusSelectionSource
    extends EventEmitter<SelectionSourceEvents>
    implements SelectionSource
{
    readonly label: string = "Testlabel";

    async select(_: SelectionKind, __: SelectionOptions): Promise<SelectionResult[]> {
        const allPoints = fakeSelectedPointFeatures.map((point, index) => {
            const result: SelectionResult = {
                id: index,
                geometry: point
            };
            return result;
        });
        return allPoints;
    }
}
