// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer, MapModel, Overlay } from "@open-pioneer/map";
import { Select } from "ol/interaction";
import { unByKey } from "ol/Observable";
import type { Feature } from "ol";
import type { EventsKey } from "ol/events";
import { Layer as OlLayer } from "ol/layer";
import { BaseInteraction } from "./BaseInteraction";
import type { SelectionOptions } from "../../../api/model/InteractionOptions";
import { TooltipMessages } from "../controller/EditingController";

export interface SelectionParameters {
    readonly layers: Layer[];
    readonly selectionOptions?: SelectionOptions;
    readonly completionHandler: (feature: Feature, layer: Layer | undefined) => void;
    readonly tooltipMessages: TooltipMessages;
}

interface SelectionData {
    readonly select: Select;
    readonly eventsKey: EventsKey;
}

interface InternalSelect {
    readonly featureLayerAssociation_?: Record<string, OlLayer>;
}

interface InternalFeature extends Feature {
    readonly ol_uid?: string;
}

export class SelectionInteraction extends BaseInteraction<SelectionParameters, SelectionData> {
    private tooltip?: Overlay;

    protected override startInteraction(parameters: SelectionParameters): SelectionData {
        const { layers, selectionOptions, completionHandler, tooltipMessages } = parameters;

        const olLayers = layers
            .map((layer) => layer.olLayer)
            .filter((olLayer) => olLayer instanceof OlLayer);

        const select = new Select({
            layers: olLayers,
            hitTolerance: SelectionInteraction.DEFAULT_HIT_TOLERANCE,
            ...selectionOptions
        });

        const eventsKey = select.once("select", ({ selected }) => {
            const feature = selected[0];
            if (feature != null) {
                const layer = this.getLayer(select, feature);
                completionHandler(feature, layer);
            }
        });

        this.tooltip = this.createHelpTooltip(this.mapModel, tooltipMessages);

        this.map.addInteraction(select);

        return { select, eventsKey };
    }

    protected override stopInteraction({ select, eventsKey }: SelectionData): void {
        unByKey(eventsKey);
        this.map.removeInteraction(select);
        this.tooltip?.destroy();
    }

    private getLayer(select: Select, feature: Feature): Layer | undefined {
        const olLayer = this.getOlLayer(select, feature);
        return olLayer != null ? this.mapModel.layers.getLayerByRawInstance(olLayer) : undefined;
    }

    // Use internal properties to obtain the layer associated with the selected feature.
    private getOlLayer(select: Select, feature: Feature): OlLayer | undefined {
        const { featureLayerAssociation_ } = select as unknown as InternalSelect;
        const { ol_uid } = feature as InternalFeature;
        return ol_uid != null ? featureLayerAssociation_?.[ol_uid] : undefined;
    }

    private createHelpTooltip(
        mapModel: MapModel,
        tooltipMessages: TooltipMessages
    ): Overlay | undefined {
        const helpOverlay = mapModel.overlays.add({
            className: "editing-tooltip printing-hide",
            position: "follow-pointer",
            tag: "editing-selection-overlay",
            offset: [15, 0],
            positioning: "center-left",
            ariaRole: "tooltip",
            content: tooltipMessages.getSelectionMessage()
        });

        return helpOverlay;
    }

    private static readonly DEFAULT_HIT_TOLERANCE = 22;
}
