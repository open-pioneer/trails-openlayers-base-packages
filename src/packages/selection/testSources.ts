// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SelectionSource, SelectionResult, SelectionOptions } from "./api";
import { Point } from "ol/geom";
import { Extent } from "ol/extent";

export const fakeSelectedPointFeatures = [
    new Point([852011.307424, 6788511.322702]),
    new Point([829800.379064, 6809086.916672])
];

// TODO: Integrate into tests
export class FakePointSelectionSource implements SelectionSource {
    readonly label = "Fake Selection Source";
    #timeout: number;

    constructor(timeout: number) {
        this.#timeout = timeout;
    }

    async select(selectionKind: Extent, options: SelectionOptions): Promise<SelectionResult[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const allPoints = fakeSelectedPointFeatures.map((point, index) => {
                    const result: SelectionResult = {
                        id: index,
                        geometry: point
                    };
                    if (!point.intersectsExtent(selectionKind)) {
                        return undefined;
                    }
                    return result;
                });
                const selectedPoints = allPoints.filter((s): s is SelectionResult => s != null);

                const limitedResults =
                    selectedPoints.length > options.maxResults
                        ? selectedPoints.slice(0, options.maxResults)
                        : selectedPoints;
                resolve(limitedResults);
            }, this.#timeout);
        });
    }
}
