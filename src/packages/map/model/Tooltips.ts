// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Map, Overlay } from "ol";
import { MapModel } from "./MapModel";
import { Coordinate } from "ol/coordinate";
import { ReactNode, ReactPortal } from "react";
import { ReactiveMap, reactiveMap } from "@conterra/reactivity-core";
import { v4 as uuid4v } from "uuid";

export class Tooltips {
    private olMap: Map;
    private tooltips: ReactiveMap<string, TooltipModel>;

    constructor(map: MapModel) {
        this.olMap = map.olMap;
        this.tooltips = reactiveMap<string, TooltipModel>();
    }

    getTooltips() {
        return this.tooltips;
    }

    addTooltip(initialPosition: Coordinate, content: ReactNode): Tooltip {
        const tooltipDiv = document.createElement("div");
        const id = uuid4v();
        const overlay = new Overlay({
            element: tooltipDiv,
            position: initialPosition,
            id: id
        });
        const model: TooltipModel = {
            content: content,
            olOverlay: overlay,
            id: id
        };
        this.tooltips.set(id, model);

        this.olMap.addOverlay(model.olOverlay);

        const tooltip = new Tooltip(model);

        return tooltip;
    }

    removeTooltip(tooltip: Tooltip): boolean {
        const model = this.tooltips.get(tooltip.id);
        if (model) {
            const olOverlay = this.olMap.removeOverlay(model.olOverlay);
            if (olOverlay) {
                this.tooltips.delete(model.id);
                return true;
            }
        }
        return false;
    }
}

export class Tooltip {
    readonly id: string;
    private model: TooltipModel;

    constructor(model: TooltipModel) {
        this.model = model;
        this.id = model.id;
    }

    getContent() {
        return this.model.content;
    }

    setPosition(position: Coordinate) {
        this.model.olOverlay.setPosition(position);
    }

    getPosition() {
        return this.model.olOverlay.getPosition();
    }
}

interface TooltipModel {
    id: string;
    content: ReactNode;
    olOverlay: Overlay;
    portal?: ReactPortal;
}
