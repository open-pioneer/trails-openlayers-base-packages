// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive, watch } from "@conterra/reactivity-core";
import { Resource } from "@open-pioneer/core";
import { MapBrowserEvent } from "ol";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import { mouseActionButton } from "ol/events/condition";
import Geometry from "ol/geom/Geometry";
import { DragBox, DragPan } from "ol/interaction";
import PointerInteraction from "ol/interaction/Pointer";

interface InteractionResource extends Resource {
    interaction: PointerInteraction;
}
/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
    setText(value: string): void;
}

const ACTIVE_CLASS = "selection-active";
const INACTIVE_CLASS = "selection-inactive";

export class DragController {
    private tooltip: Tooltip;
    private interactionResources: InteractionResource[] = [];
    private olMap: OlMap;
    private isActive = reactive(true);
    private tooltipMessage: string;
    private tooltipDisabledMessage: string;
    private tooltipSync: Resource | undefined;

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

        this.tooltip = this.createHelpTooltip(olMap, tooltipMessage);
        this.olMap = olMap;
        this.tooltipMessage = tooltipMessage;
        this.tooltipDisabledMessage = tooltipDisabledMessage;

        this.tooltipSync = watch(
            () => [this.isActive.value, this.tooltipText],
            ([isActive, tooltipText]) => {
                this.tooltip.setText(tooltipText);
                viewPort.classList.toggle(ACTIVE_CLASS, isActive);
                viewPort.classList.toggle(INACTIVE_CLASS, !isActive);
            },
            {
                immediate: true
            }
        );
    }

    initViewport(olMap: OlMap) {
        const viewPort = olMap.getViewport();
        viewPort.classList.add(ACTIVE_CLASS);

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
        this.tooltipSync?.destroy();
        this.tooltipSync = undefined;

        this.tooltip.destroy();
        this.interactionResources.forEach((interaction) => {
            interaction.destroy();
        });
    }

    /**
     * The current tooltip text shown to the user.
     */
    get tooltipText(): string {
        const isActive = this.isActive.value;
        return isActive ? this.tooltipMessage : this.tooltipDisabledMessage;
    }

    setActive(isActive: boolean) {
        if (this.isActive.value === isActive) {
            return;
        }

        if (isActive) {
            this.interactionResources.forEach((interaction) =>
                this.olMap.addInteraction(interaction.interaction)
            );
            this.isActive.value = true;
        } else {
            this.interactionResources.forEach((interaction) =>
                this.olMap.removeInteraction(interaction.interaction)
            );
            this.isActive.value = false;
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
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.remove(INACTIVE_CLASS);
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
        const condition = function (mapBrowserEvent: MapBrowserEvent) {
            const originalEvent = mapBrowserEvent.originalEvent;
            return "button" in originalEvent && originalEvent.button == 2;
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
                viewPort.classList.remove(ACTIVE_CLASS);
                viewPort.classList.remove(INACTIVE_CLASS);
                viewPort.oncontextmenu = null;
            }
        };

        return interactionResource;
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
