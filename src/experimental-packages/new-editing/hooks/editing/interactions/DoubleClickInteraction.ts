// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import { DoubleClickZoom, type Interaction } from "ol/interaction";
import { BaseInteraction } from "../base/BaseInteraction";

// A double-click is used to finish drawing a feature. Hence, disable the double-click zoom
// interaction, which would otherwise be triggered along with it.
export class DoubleClickInteraction extends BaseInteraction<{}, DoubleClickData> {
    constructor(mapModel: MapModel) {
        super(mapModel, {});
    }

    protected startInteraction(): DoubleClickData {
        const doubleClickZoom = this.getDoubleClickZoom();
        const wasActive = doubleClickZoom?.getActive() ?? false;

        doubleClickZoom?.setActive(false);

        return { doubleClickZoom, wasActive };
    }

    protected stopInteraction({ doubleClickZoom, wasActive }: DoubleClickData): void {
        if (doubleClickZoom != null) {
            doubleClickZoom.setActive(wasActive);
        }
    }

    private getDoubleClickZoom(): Interaction | undefined {
        return this.map
            .getInteractions()
            .getArray()
            .find((interaction) => interaction instanceof DoubleClickZoom);
    }
}

interface DoubleClickData {
    readonly doubleClickZoom: Interaction | undefined;
    readonly wasActive: boolean;
}
