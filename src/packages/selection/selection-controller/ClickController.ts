// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import { MapBrowserEvent } from "ol";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import Geometry from "ol/geom/Geometry";
import { Polygon } from "ol/geom";


/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
    setText(value: string): void;
}

const ACTIVE_CLASS = "selection-active";
const INACTIVE_CLASS = "selection-inactive";

export class ClickController {
    private tooltip: Tooltip;
    private olMap: OlMap;
    private isActive: boolean = true;
    private tooltipMessage: string;
    private tooltipDisabledMessage: string;

    private onClick: (evt: MapBrowserEvent<UIEvent>) => void;

    constructor(
        olMap: OlMap,
        tooltipMessage: string,
        tooltipDisabledMessage: string,
        onExtentSelected: (geometry: Geometry) => void
    ) {        
        this.tooltip = this.createHelpTooltip(olMap, tooltipMessage);
        this.olMap = olMap;
        this.tooltipMessage = tooltipMessage;
        this.tooltipDisabledMessage = tooltipDisabledMessage;
        this.onClick = this.getEventHandlerFunction(onExtentSelected);
        this.olMap.on("singleclick", this.onClick);
        this.olMap.getViewport().classList.add(ACTIVE_CLASS);
    }

    /**
     * Method for destroying the controller when it is no longer needed
     */
    destroy() {
        this.tooltip.destroy();
        this.olMap.un("singleclick", this.onClick);
        this.olMap.getViewport().classList.remove(ACTIVE_CLASS);
        this.olMap.getViewport().classList.remove(INACTIVE_CLASS);

    }

    setActive(isActive: boolean) {
        if (this.isActive === isActive) return;
        const viewPort = this.olMap.getViewport();
        if (isActive) {
            this.tooltip.setText(this.tooltipMessage);
            viewPort.classList.remove(INACTIVE_CLASS);
            viewPort.classList.add(ACTIVE_CLASS);
            this.isActive = true;
        } else {
            this.olMap.un("singleclick", this.onClick);
            this.tooltip.setText(this.tooltipDisabledMessage);
            viewPort.classList.remove(ACTIVE_CLASS);
            viewPort.classList.add(INACTIVE_CLASS);
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



    /**
     * Method to generate a tooltip on the mouse cursor
     */
    private createHelpTooltip(olMap: OlMap, message: string): Tooltip {
        const element = document.createElement("div");
        element.className = "selection-tooltip printing-hide";
        element.role = "tooltip";

        const content = document.createElement("span");
        content.textContent = message;
        element.appendChild(content);

        const overlay = new Overlay({
            element: element,
            offset: [15, 0],
            positioning: "center-left"
        });

        const pointHandler = olMap.on("pointermove", (evt) => {
            overlay.setPosition(evt.coordinate);
        });

        olMap.addOverlay(overlay);
        return {
            overlay,
            element,
            destroy() {
                olMap.removeOverlay(overlay);
                overlay.dispose();
                unByKey(pointHandler);
            },
            setText(value) {
                content.textContent = value;
            }
        };
    }

}