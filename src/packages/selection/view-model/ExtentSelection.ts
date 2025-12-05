// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { destroyResources, Resource } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { mouseActionButton } from "ol/events/condition";
import { Geometry } from "ol/geom";
import { DragBox, DragPan } from "ol/interaction";
import MapBrowserEvent from "ol/MapBrowserEvent";

/**
 * Registers interactions on the map for extent selection.
 *
 * Calls `onSuccess` whenever the user selected an extent.
 */
export class ExtentSelection {
    #map: MapModel;
    #onSuccess: (geometry: Geometry) => void;

    #resources: Resource[];

    constructor(map: MapModel, onSuccess: (geometry: Geometry) => void) {
        this.#map = map;
        this.#onSuccess = onSuccess;

        this.#resources = [
            createDragboxInteraction(this.#map, this.#onSuccess),
            createPanningInteraction(this.#map)
        ];
    }

    destroy() {
        destroyResources(this.#resources);
    }
}

function createDragboxInteraction(
    map: MapModel,
    onSuccess: (geometry: Geometry) => void
): Resource {
    const olMap = map.olMap;
    const dragbox = new DragBox({
        className: "selection-drag-box",
        condition: mouseActionButton
    });
    dragbox.on("boxend", function () {
        onSuccess(dragbox.getGeometry());
    });

    olMap.addInteraction(dragbox);
    return {
        destroy() {
            olMap.removeInteraction(dragbox);
            dragbox.dispose();
        }
    };
}

// For panning using the right mouse button during selection
function createPanningInteraction(map: MapModel): Resource {
    const olMap = map.olMap;
    const rightClick = (mapBrowserEvent: MapBrowserEvent) => {
        const originalEvent = mapBrowserEvent.originalEvent;
        return "button" in originalEvent && originalEvent.button === 2;
    };
    const drag = new DragPan({
        condition: rightClick
    });

    olMap.addInteraction(drag);
    return {
        destroy() {
            olMap.removeInteraction(drag);
            drag.dispose();
        }
    };
}
