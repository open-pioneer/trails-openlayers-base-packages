// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Map, Overlay as OlOverlay } from "ol";
import { MapModel } from "./MapModel";
import { Coordinate } from "ol/coordinate";
import { ReactNode } from "react";
import { ReactiveMap, reactiveMap } from "@conterra/reactivity-core";
import { v4 as uuid4v } from "uuid";
import { Options } from "ol/Overlay";
import { Resource } from "@open-pioneer/core";

export const GET_OVERLAYS_MAP = Symbol("GET_OVERLAYS_MAP");

export class Overlays {
    private olMap: Map;
    private tooltips: ReactiveMap<string, OverlayModel>;

    constructor(map: MapModel) {
        this.olMap = map.olMap;
        this.tooltips = reactiveMap<string, OverlayModel>();
    }

    [GET_OVERLAYS_MAP]() {
        return this.tooltips;
    }

    addOverlay(properties: OverlayProperties, content: ReactNode): Overlay {
        const tooltipDiv = document.createElement("div");
        const id = uuid4v();
        const overlay = new OlOverlay({
            element: tooltipDiv,
            id: id,
            ...properties
        });

        const model: OverlayModel = {
            content: content,
            olOverlay: overlay,
            id: id,
            destroyed: false,
            update: () => {
                //this.tooltips.delete(model.id);
                this.tooltips.set(model.id, {
                    ...model
                });
            },
            destroy: () => {
                this.olMap.removeOverlay(model.olOverlay);
                this.tooltips.delete(model.id);
                model.destroyed = true;
            }
        };
        this.tooltips.set(id, model);

        this.olMap.addOverlay(model.olOverlay);

        const tooltip = new Overlay(model);

        return tooltip;
    }
}

export class Overlay {
    readonly id: string;
    private model: OverlayModel;

    constructor(model: OverlayModel) {
        this.model = model;
        this.id = model.id;
    }

    setContent(content: ReactNode) {
        this.model.content = content;
        this.model.update();
    }

    setPosition(position: Coordinate | undefined) {
        this.model.olOverlay.setPosition(position);
    }

    getPosition() {
        return this.model.olOverlay.getPosition();
    }

    isDestroyed(): boolean {
        return this.model.destroyed;
    }

    destroy() {
        this.model.destroy();
    }
}

interface OverlayModel extends Resource {
    id: string;
    content: ReactNode;
    destroyed: boolean;
    olOverlay: OlOverlay;
    update: () => void;
}

export interface OverlayProperties extends Omit<Options, "id" | "element"> {}
