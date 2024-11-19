// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapBrowserEvent } from "ol";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import Geometry from "ol/geom/Geometry";
import { Polygon } from "ol/geom";
import { activateViewportInteraction, createHelpTooltip, deactivateViewportInteraction, Tooltip } from "./helper";
import { EventsKey } from "ol/events";


export class ClickController {
    private tooltip: Tooltip;
    private olMap: OlMap;
    private isActive: boolean = true;
    private tooltipMessage: string;
    private tooltipDisabledMessage: string;

    private onClick: (evt: MapBrowserEvent<UIEvent>) => void;
    private eventKey: EventsKey;

    constructor(
        olMap: OlMap,
        tooltipMessage: string,
        tooltipDisabledMessage: string,
        onExtentSelected: (geometry: Geometry) => void
    ) {
        this.tooltip = createHelpTooltip(olMap, tooltipMessage);
        this.olMap = olMap;
        this.tooltipMessage = tooltipMessage;
        this.tooltipDisabledMessage = tooltipDisabledMessage;
        this.onClick = this.getEventHandlerFunction(onExtentSelected);
        this.eventKey = this.olMap.on("singleclick", this.onClick);
        activateViewportInteraction(olMap);
    }

    /**
     * Method for destroying the controller when it is no longer needed
     */
    destroy() {
        this.tooltip.destroy();
        unByKey(this.eventKey);
        deactivateViewportInteraction(this.olMap);

    }

    setActive(isActive: boolean) {
        if (this.isActive === isActive) return;
        if (isActive) {
            this.tooltip.setText(this.tooltipMessage);
            activateViewportInteraction(this.olMap);
            this.isActive = true;
        } else {
            unByKey(this.eventKey);
            this.tooltip.setText(this.tooltipDisabledMessage);
            deactivateViewportInteraction(this.olMap);
            this.isActive = false;
        }
    }

    private getEventHandlerFunction(onExtentSelected: (geometry: Geometry) => void) {
        const pixelTolerance = 5;
        const map = this.olMap;
        const getExtentFromEvent = (evt: MapBrowserEvent<UIEvent>) => {
            const coordinates = evt.coordinate;
            const pixel = map.getPixelFromCoordinate(coordinates);
            const clickTolerance = [
                [pixel[0]! - pixelTolerance, pixel[1]! - pixelTolerance],
                [pixel[0]! - pixelTolerance, pixel[1]! + pixelTolerance],
                [pixel[0]! + pixelTolerance, pixel[1]! + pixelTolerance],
                [pixel[0]! + pixelTolerance, pixel[1]! - pixelTolerance],
                [pixel[0]! - pixelTolerance, pixel[1]! - pixelTolerance],
            ];
            const extent = clickTolerance.map((pixel) => map.getCoordinateFromPixel(pixel));
            const geometry = new Polygon([extent]);
            onExtentSelected(geometry);
        };
        return getExtentFromEvent;
    }
}