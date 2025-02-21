// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import {
    SelectionSource,
    SelectionResult,
    SelectionOptions,
    SelectionSourceStatus,
    SelectionKind
} from "./api";
import { Point } from "ol/geom";

export const fakeSelectedPointFeatures = [
    new Point([407354, 5754673]), // con terra (Bottom Right)
    new Point([404740, 5757893]) // Schloss (Top Left)
];

let count = 0;

export class FakePointSelectionSource implements SelectionSource {
    readonly label = `Fake Selection Source #${++count}`;
    #timeout: number;
    #status: Reactive<SelectionSourceStatus>;
    #pointFeatures: Point[];

    constructor(
        timeout?: number,
        status?: SelectionSourceStatus,
        pointFeatures: Point[] = fakeSelectedPointFeatures
    ) {
        this.#timeout = timeout || 0;
        this.#status = reactive(status || "unavailable");
        this.#pointFeatures = pointFeatures;
    }

    get status(): SelectionSourceStatus {
        return this.#status.value;
    }

    set status(value: SelectionSourceStatus) {
        this.#status.value = value;
    }

    async select(
        selectionKind: SelectionKind,
        options: SelectionOptions
    ): Promise<SelectionResult[]> {
        if (selectionKind.type !== "extent") {
            throw new Error(`Unsupported selection kind: ${selectionKind.type}`);
        }

        if (this.#status.value !== "available") return [];

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
 * For testing purposes only
 */
export class NoStatusSelectionSource implements SelectionSource {
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
