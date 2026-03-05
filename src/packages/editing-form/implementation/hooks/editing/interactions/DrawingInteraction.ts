// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Draw } from "ol/interaction";
import { Vector as VectorLayer } from "ol/layer";
import { unByKey } from "ol/Observable";
import { Vector as VectorSource } from "ol/source";

import type { Feature } from "ol";
import type { EventsKey } from "ol/events";
import type { Type as GeometryType } from "ol/geom/Geometry";

import { BaseInteraction } from "../base/BaseInteraction";
import type { DrawingTracker, DrawingActionHandler } from "../controller/DrawingSession";
import type { DrawingOptions } from "../../../../api/model/InteractionOptions";

export class DrawingInteraction extends BaseInteraction<DrawingParameters, DrawingData> {
    protected override startInteraction(parameters: DrawingParameters): DrawingData {
        const { geometryType, tracker, drawingOptions, completionHandler } = parameters;

        const source = new VectorSource();
        const drawLayer = new VectorLayer({ source });
        const draw = new Draw({ source, type: geometryType, ...drawingOptions });

        const handler: DrawingActionHandler = {
            undo: () => draw.removeLastPoint(),
            redo: (coordinate) => draw.appendCoordinates([coordinate]),
            finish: () => draw.finishDrawing(),
            reset: () => draw.abortDrawing()
        };

        const eventsKeys = [
            draw.on("drawstart", ({ feature }) => tracker.trackCapabilities(feature, handler)),
            draw.on("drawabort", () => tracker.untrackCapabilities()),
            draw.once("drawend", ({ feature }) => completionHandler(feature, drawLayer))
        ];

        this.map.addLayer(drawLayer);
        this.map.addInteraction(draw);

        return { draw, drawLayer, eventsKeys, tracker };
    }

    protected override stopInteraction(data: DrawingData): void {
        const { draw, drawLayer, eventsKeys, tracker } = data;

        this.map.removeInteraction(draw);
        this.map.removeLayer(drawLayer);
        unByKey(eventsKeys);
        tracker.untrackCapabilities();
    }
}

export interface DrawingParameters {
    readonly geometryType: GeometryType;
    readonly tracker: DrawingTracker;
    readonly drawingOptions?: DrawingOptions;
    readonly completionHandler: (feature: Feature, drawLayer: VectorLayer) => void;
}

interface DrawingData {
    readonly draw: Draw;
    readonly drawLayer: VectorLayer;
    readonly eventsKeys: EventsKey[];
    readonly tracker: DrawingTracker;
}
