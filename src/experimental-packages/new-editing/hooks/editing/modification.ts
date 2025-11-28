// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Highlight, HighlightOptions, MapModel } from "@open-pioneer/map";

import { Collection, type Feature } from "ol";
import { Modify } from "ol/interaction";
import { Circle, Fill, Stroke, Style } from "ol/style";
import type { Layer } from "ol/layer";
import type { Options } from "ol/interaction/Modify";

import { startSnapping, type StartSnappingOptions } from "./snapping";

export function startModifyingFeature(options: StartModifyingFeatureOptions): CleanUpAction {
    const removeModifyInteraction = addModifyInteraction(options);
    const removeHighlighting = highlightFeature(options);
    const stopSnapping = startSnapping({ map: options.mapModel.olMap, ...options });

    return () => {
        removeModifyInteraction();
        removeHighlighting();
        stopSnapping();
    };
}

function addModifyInteraction({
    mapModel,
    feature,
    drawLayer,
    modifyOptions
}: StartModifyingFeatureOptions): CleanUpAction {
    const features = new Collection([feature]);
    const modify = new Modify({ features, ...modifyOptions });
    const map = mapModel.olMap;

    if (drawLayer != null) {
        map.addLayer(drawLayer);
    }
    map.addInteraction(modify);

    const originalGeometry = feature.getGeometry()?.clone();

    return () => {
        if (drawLayer != null) {
            map.removeLayer(drawLayer);
        }
        map.removeInteraction(modify);
        feature.setGeometry(originalGeometry);
    };
}

function highlightFeature({
    mapModel,
    feature,
    highlightFeature,
    highlightOptions
}: StartModifyingFeatureOptions): CleanUpAction {
    let highlight: Highlight | undefined;
    const geometry = feature.getGeometry();

    if (highlightFeature && geometry != null) {
        const options = getHighlightOptions(highlightOptions);
        highlight = mapModel.highlight([geometry], options);
    }

    return () => {
        highlight?.destroy();
    };
}

function getHighlightOptions(highlightOptions: HighlightOptions | undefined): HighlightOptions {
    return {
        ...highlightOptions,
        highlightStyle: {
            Point: DEFAULT_POINT_HIGHLIGHT_STYLE,
            ...highlightOptions?.highlightStyle
        }
    };
}

const DEFAULT_POINT_HIGHLIGHT_STYLE = new Style({
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

interface StartModifyingFeatureOptions extends Omit<StartSnappingOptions, "map"> {
    readonly mapModel: MapModel;
    readonly feature: Feature;
    readonly drawLayer?: Layer;
    readonly modifyOptions: ModifyOptions | undefined;
    readonly highlightFeature: boolean;
    readonly highlightOptions: HighlightOptions | undefined;
}

export type ModifyOptions = Omit<Options, "features" | "source">;

type CleanUpAction = () => void;
