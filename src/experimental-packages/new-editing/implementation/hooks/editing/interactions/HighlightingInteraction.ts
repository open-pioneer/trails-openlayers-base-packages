// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Highlight, HighlightOptions } from "@open-pioneer/map";

import type { Feature } from "ol";
import { Circle, Fill, Stroke, Style } from "ol/style";

import { BaseInteraction } from "../base/BaseInteraction";

export class HighlightingInteraction extends BaseInteraction<HighlightingParameters, Data> {
    protected override startInteraction(parameters: HighlightingParameters): Data {
        const { feature, highlightOptions } = parameters;
        const geometry = feature.getGeometry();

        if (geometry != null) {
            const options = this.getHighlightOptions(highlightOptions);
            const highlight = this.mapModel.highlight([geometry], options);
            return { highlight };
        } else {
            return {};
        }
    }

    protected override stopInteraction({ highlight }: Data): void {
        highlight?.destroy();
    }

    private getHighlightOptions(highlightOptions: HighlightOptions | undefined): HighlightOptions {
        return {
            ...highlightOptions,
            highlightStyle: {
                Point: HighlightingInteraction.DEFAULT_POINT_HIGHLIGHT_STYLE,
                ...highlightOptions?.highlightStyle
            }
        };
    }

    private static readonly DEFAULT_POINT_HIGHLIGHT_STYLE = new Style({
        image: new Circle({
            stroke: new Stroke({
                color: "cyan",
                width: 4.0
            }),
            fill: new Fill({
                color: "rgba(224,255,255,0.35)"
            }),
            radius: 12.0
        })
    });
}

export interface HighlightingParameters {
    readonly feature: Feature;
    readonly highlightOptions?: HighlightOptions;
}

interface Data {
    readonly highlight?: Highlight;
}
