// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { type Layer, type MapModel, Overlay } from "@open-pioneer/map";
import { Collection, type Feature } from "ol";
import type { Geometry } from "ol/geom";
import type { Type as GeometryType } from "ol/geom/Geometry";
import { Modify } from "ol/interaction";
import type { ModificationOptions } from "../../../api/model/InteractionOptions";
import { BaseInteraction } from "./BaseInteraction";
import type { TooltipMessages } from "../controller/EditingController";

export interface ModificationParameters {
    readonly feature: Feature;
    readonly drawLayer?: Layer;
    readonly modificationOptions?: ModificationOptions;
    readonly tooltipMessages: TooltipMessages;
}

interface Data {
    readonly feature: Feature;
    readonly modify: Modify;
    readonly drawLayer: Layer | undefined;
    readonly originalGeometry: Geometry | undefined;
}

export class ModificationInteraction extends BaseInteraction<ModificationParameters, Data> {
    private tooltip: Overlay | undefined;

    protected override startInteraction(parameters: ModificationParameters): Data {
        const { feature, drawLayer, modificationOptions, tooltipMessages } = parameters;

        const features = new Collection([feature]);
        const modify = new Modify({ features, ...modificationOptions });
        const originalGeometry = feature.getGeometry()?.clone();

        if (drawLayer != null) {
            this.mapModel.layers.addLayer(drawLayer, { at: "topmost" });
        }

        this.tooltip = this.createHelpTooltip(
            this.mapModel,
            tooltipMessages,
            originalGeometry?.getType()
        );

        this.map.addInteraction(modify);

        return { feature, modify, drawLayer, originalGeometry };
    }

    protected override stopInteraction(data: Data): void {
        const { feature, modify, drawLayer, originalGeometry } = data;

        this.map.removeInteraction(modify);

        if (drawLayer != null) {
            this.mapModel.layers.removeLayer(drawLayer);
            drawLayer.destroy();
        }
        if (originalGeometry != null) {
            feature.setGeometry(originalGeometry);
        }

        this.tooltip?.destroy();
    }

    private createHelpTooltip(
        mapModel: MapModel,
        tooltipMessages: TooltipMessages,
        geometryType?: GeometryType
    ): Overlay | undefined {
        const modificationMessages = tooltipMessages.getModificationMessages();
        const message =
            geometryType === "Point"
                ? modificationMessages.get("Point")
                : modificationMessages.get("default");

        const helpOverlay = mapModel.overlays.add({
            className: "editing-tooltip printing-hide",
            position: "follow-pointer",
            tag: "editing-modification-overlay",
            offset: [15, 0],
            positioning: "center-left",
            ariaRole: "tooltip",
            content: message
        });

        return helpOverlay;
    }
}
