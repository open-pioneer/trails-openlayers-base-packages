// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { StyleLike } from "ol/style/Style";
import { Editing } from "./api";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import OlMap from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import { EventsKey } from "ol/events";

export class EditingImpl implements Editing {
    private readonly olMap: OlMap;
    private activeLayer?: Layer;
    private drawAbortListener: EventsKey;
    private drawEndListener: EventsKey;
    private errorListener: EventsKey;
    private drawInteraction: Draw;
    private readonly drawSource: VectorSource;
    private readonly drawLayer: VectorLayer<VectorSource>;

    constructor(olMap: OlMap, editingStyle?: StyleLike | undefined) {
        this.olMap = olMap;
        this.activeLayer = undefined;

        // Create and add draw source and layer to map
        this.drawSource = new VectorSource();
        this.drawLayer = new VectorLayer({
            source: this.drawSource,
            style: editingStyle,
            zIndex: TOPMOST_LAYER_Z
        });
        this.olMap.addLayer(this.drawLayer);

        // Create draw interaction
        this.drawInteraction = new Draw({
            source: this.drawSource,
            type: "Polygon"
        });

        // Add event listener
        this.drawAbortListener = this.drawInteraction.on("drawabort", () => {});
        this.drawEndListener = this.drawInteraction.on("drawend", (e) => {
            const feature = e.feature;
            console.log(feature);
            // TODO: Push to OGC API
        });
        this.errorListener = this.drawInteraction.on("error", () => {});
    }

    startEditing(layer: Layer<{}>): void {
        // stopEditing before startEditing, if activeLayer is set
        if (this.activeLayer) {
            this.stopEditing();
        }

        // Set active layer to configured layer
        this.activeLayer = layer;

        this.olMap.addInteraction(this.drawInteraction);
    }

    stopEditing(): void {
        // Delete all features from draw source
        this.drawSource.clear();

        // Unset active layer
        this.activeLayer = undefined;

        this.olMap.removeInteraction(this.drawInteraction);
    }
}
