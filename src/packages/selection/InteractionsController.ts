// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import OlMap from "ol/Map";
import { DragBox } from "ol/interaction.js";
export class InteractionsController {
    private olMap: OlMap;
    private currentDragBox: DragBox | undefined;

    constructor(olMap: OlMap) {
        this.olMap = olMap;
    }

    destroy() {
        this.removeDragBoxInteraction();
    }

    removeDragBoxInteraction() {
        if (this.currentDragBox) {
            this.olMap.removeInteraction(this.currentDragBox);
        }
    }

    setCurrentDragBox(dragBox: DragBox | undefined) {
        this.currentDragBox = dragBox;
    }
}
