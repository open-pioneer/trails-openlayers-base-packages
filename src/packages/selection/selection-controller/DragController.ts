// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import OlMap from "ol/Map";
import { mouseActionButton } from "ol/events/condition";
import Geometry from "ol/geom/Geometry";
import { DragBox, DragPan } from "ol/interaction";
import PointerInteraction from "ol/interaction/Pointer";
import { activateViewportInteraction, createHelpTooltip, deactivateViewportInteraction, Tooltip } from "./helper";

interface InteractionResource extends Resource {
    interaction: PointerInteraction;
}

export class DragController {
    private tooltip: Tooltip;
    private interactionResources: InteractionResource[] = [];
    private olMap: OlMap;
    private isActive: boolean = true;
    private tooltipMessage: string;
    private tooltipDisabledMessage: string;

    constructor(
        olMap: OlMap,
        tooltipMessage: string,
        tooltipDisabledMessage: string,
        onExtentSelected: (geometry: Geometry) => void
    ) {
        const viewPort = this.initViewport(olMap);
        this.interactionResources.push(
            this.createDragBox(olMap, onExtentSelected, viewPort, this.interactionResources)
        );
        this.interactionResources.push(this.createDrag(olMap, viewPort, this.interactionResources));

        this.tooltip = createHelpTooltip(olMap, tooltipMessage);
        this.olMap = olMap;
        this.tooltipMessage = tooltipMessage;
        this.tooltipDisabledMessage = tooltipDisabledMessage;
    }

    initViewport(olMap: OlMap) {
        activateViewportInteraction(olMap);
        const viewPort = olMap.getViewport();

        viewPort.oncontextmenu = (e) => {
            e.preventDefault();
            return false;
        };
        return viewPort;
    }

    /**
     * Method for destroying the controller when it is no longer needed
     */
    destroy() {
        this.tooltip.destroy();
        this.interactionResources.forEach((interaction) => {
            interaction.destroy();
        });
    }

    setActive(isActive: boolean) {
        if (this.isActive === isActive) return;
        if (isActive) {
            this.interactionResources.forEach((interaction) =>
                this.olMap.addInteraction(interaction.interaction)
            );
            this.tooltip.setText(this.tooltipMessage);
            activateViewportInteraction(this.olMap);
            this.isActive = true;
        } else {
            this.interactionResources.forEach((interaction) =>
                this.olMap.removeInteraction(interaction.interaction)
            );
            this.tooltip.setText(this.tooltipDisabledMessage);
            deactivateViewportInteraction(this.olMap);
            this.isActive = false;
        }
    }

    /**
     * Method to create a simple extent-selection
     */
    private createDragBox(
        olMap: OlMap,
        onExtentSelected: (geometry: Geometry) => void,
        viewPort: HTMLElement,
        interactionResources: InteractionResource[]
    ): InteractionResource {
        const dragBox = new DragBox({
            className: "selection-drag-box",
            condition: mouseActionButton
        });

        olMap.addInteraction(dragBox);
        dragBox.on("boxend", function () {
            onExtentSelected(dragBox.getGeometry());
        });

        const interactionResource: InteractionResource = {
            interaction: dragBox,
            destroy() {
                olMap.removeInteraction(dragBox);
                interactionResources.splice(interactionResources.indexOf(this));
                dragBox.dispose();
                deactivateViewportInteraction(olMap);
                viewPort.oncontextmenu = null;
            }
        };
        return interactionResource;
    }

    /**
     * Method to activate pan with right-mouse-click
     */
    private createDrag(
        olMap: OlMap,
        viewPort: HTMLElement,
        interactionResources: InteractionResource[]
    ): InteractionResource {
        const condition = function (mapBrowserEvent: {
            originalEvent: MouseEvent;
            dragging: unknown;
        }) {
            const originalEvent = /** @type {MouseEvent} */ mapBrowserEvent.originalEvent;
            return originalEvent.button == 2;
        };
        const drag = new DragPan({
            condition: condition
        });

        olMap.addInteraction(drag);

        const interactionResource: InteractionResource = {
            interaction: drag,
            destroy() {
                olMap.removeInteraction(drag);
                interactionResources.splice(interactionResources.indexOf(this));
                drag.dispose();
                deactivateViewportInteraction(olMap);
                viewPort.oncontextmenu = null;
            }
        };

        return interactionResource;
    }


    /**
     * Method for testing purposes only
     * @returns InteractionResource of class DragBox
     */
    getDragboxInteraction() {
        return this.interactionResources.find(
            (interactionResource) => interactionResource.interaction instanceof DragBox
        );
    }

    /**
     * Method for testing purposes only
     * @returns InteractionResource of class DragPan
     */
    getDragPanInteraction() {
        return this.interactionResources.find(
            (interactionResource) => interactionResource.interaction instanceof DragPan
        );
    }
}
