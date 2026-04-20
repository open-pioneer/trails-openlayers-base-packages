// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Draw } from "ol/interaction";
import { Vector as VectorLayer } from "ol/layer";
import { unByKey } from "ol/Observable";
import { Vector as VectorSource } from "ol/source";
import type { Feature } from "ol";
import type { EventsKey } from "ol/events";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { BaseInteraction } from "./BaseInteraction";
import type { DrawingTracker, DrawingActionHandler } from "../controller/DrawingSession";
import type { DrawingOptions } from "../../../api/model/InteractionOptions";
import { LayerFactory, MapModel, Overlay, SimpleLayer } from "@open-pioneer/map";
import { TooltipMessages } from "../controller/EditingController";
import { destroyResource } from "@open-pioneer/core";

export interface DrawingParameters {
    readonly geometryType: GeometryType;
    readonly tracker: DrawingTracker;
    readonly drawingOptions?: DrawingOptions;
    /** The completion handler takes ownership of the drawLayer and needs to destroy it if it is no longer needed. */
    readonly completionHandler: (feature: Feature, drawLayer: SimpleLayer) => void;
    readonly layerFactory: LayerFactory;
    readonly tooltipMessages: TooltipMessages;
}

interface DrawingData {
    readonly draw: Draw;
    readonly eventsKeys: EventsKey[];
    readonly tracker: DrawingTracker;
}

export class DrawingInteraction extends BaseInteraction<DrawingParameters, DrawingData> {
    private tooltip?: Overlay;
    private drawLayer: SimpleLayer | undefined;

    protected override startInteraction(parameters: DrawingParameters): DrawingData {
        const {
            geometryType,
            tracker,
            drawingOptions,
            completionHandler,
            layerFactory,
            tooltipMessages
        } = parameters;

        const source = new VectorSource();
        const drawLayer = (this.drawLayer = layerFactory.create({
            type: SimpleLayer,
            internal: true,
            title: "editing-draw-layer",
            olLayer: new VectorLayer<VectorSource, Feature>({
                source: source
            })
        }));
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
            draw.once("drawend", ({ feature }) => {
                const drawLayer = this.drawLayer;
                if (!drawLayer) {
                    return;
                }

                // Remove from map but DO NOT destroy: completionHandler takes ownership
                this.mapModel.layers.removeLayer(drawLayer);
                this.drawLayer = undefined;
                completionHandler(feature, drawLayer);
            })
        ];

        this.tooltip = this.createHelpTooltip(this.mapModel, tooltipMessages, geometryType);

        this.mapModel.layers.addLayer(drawLayer, { at: "topmost" });

        this.map.addInteraction(draw);

        return { draw, eventsKeys, tracker };
    }

    protected override stopInteraction(data: DrawingData): void {
        const { draw, eventsKeys, tracker } = data;

        this.map.removeInteraction(draw);

        // Cleanup draw layer if it wasn't passed to the completionHandler
        if (this.drawLayer) {
            this.mapModel.layers.removeLayer(this.drawLayer);
            this.drawLayer = destroyResource(this.drawLayer);
        }
        this.tooltip?.destroy();
        unByKey(eventsKeys);
        tracker.untrackCapabilities();
    }

    private createHelpTooltip(
        mapModel: MapModel,
        tooltipMessages: TooltipMessages,
        geometryType: GeometryType
    ): Overlay | undefined {
        const message = tooltipMessages.getDrawingMessages().get(geometryType);
        if (!message) {
            return undefined;
        }

        const helpOverlay = mapModel.overlays.add({
            className: "editing-tooltip printing-hide",
            position: "follow-pointer",
            tag: "editing-draw-overlay",
            offset: [15, 0],
            positioning: "center-left",
            ariaRole: "tooltip",
            content: message
        });

        return helpOverlay;
    }
}
