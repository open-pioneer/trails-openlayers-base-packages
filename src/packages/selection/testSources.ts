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

export const fakeSelectedPointFeatures = [
    new Point([852011, 6788511]),
    new Point([829800, 6809086])
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