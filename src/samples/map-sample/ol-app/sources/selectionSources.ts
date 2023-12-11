// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    SelectionSource,
    SelectionResult,
    SelectionOptions,
    SelectionSourceStatus,
    SelectionKind
} from "@open-pioneer/selection";
import { Point } from "ol/geom";

export const fakeSelectedPointFeatures = [
    new Point([852011, 6788511]),
    new Point([829800, 6809086])
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
