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
import type { EditingTracker, EditingActionHandler } from "../controller/EditingSession";
import type { DrawOptions } from "../../../model/FeatureTemplate";

export class DrawingInteraction extends BaseInteraction<DrawingOptions, DrawingData> {
    protected override startInteraction(options: DrawingOptions): DrawingData {
        const { geometryType, tracker, drawOptions, completionHandler } = options;

        const source = new VectorSource();
        const drawLayer = new VectorLayer({ source });
        const draw = new Draw({ source, type: geometryType, ...drawOptions });

        const operator: EditingActionHandler = {
            undo: () => draw.removeLastPoint(),
            redo: (coordinate) => draw.appendCoordinates([coordinate]),
            finishDrawing: () => draw.finishDrawing(),
            abortDrawing: () => draw.abortDrawing()
        };

        const eventsKeys = [
            draw.on("drawstart", ({ feature }) => tracker.trackCapabilities(feature, operator)),
            draw.on("drawabort", () => tracker.untrackCapabilities()),
            draw.once("drawend", ({ feature }) => completionHandler(feature, drawLayer))
        ];

        this.map.addLayer(drawLayer);
        this.map.addInteraction(draw);

        return { draw, drawLayer, tracker, eventsKeys };
    }

    protected override stopInteraction(data: DrawingData): void {
        const { draw, drawLayer, tracker, eventsKeys } = data;

        this.map.removeInteraction(draw);
        this.map.removeLayer(drawLayer);
        tracker.untrackCapabilities();
        unByKey(eventsKeys);
    }
}

export interface DrawingOptions {
    readonly geometryType: GeometryType;
    readonly tracker: EditingTracker;
    readonly drawOptions?: DrawOptions;
    readonly completionHandler: (feature: Feature, drawLayer: VectorLayer) => void;
}

export type { DrawOptions };

interface DrawingData {
    readonly draw: Draw;
    readonly drawLayer: VectorLayer;
    readonly tracker: EditingTracker;
    readonly eventsKeys: EventsKey[];
}
