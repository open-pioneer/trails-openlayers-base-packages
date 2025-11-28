// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Map as OlMap, Overlay as OlOverlay } from "ol";
import { MapModel } from "./MapModel";
import { Coordinate } from "ol/coordinate";
import { ReactNode } from "react";
import { reactive, Reactive, reactiveSet } from "@conterra/reactivity-core";
import { v4 as uuid4v } from "uuid";
import { Options } from "ol/Overlay";
import { createLogger, Resource } from "@open-pioneer/core";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";

export const GET_CURRENT_OVERLAYS = Symbol("GET_CURRENT_OVERLAYS");
export const REGISTER_OVERLAY = Symbol("REGISTER_OVERLAY");
export const UNREGISTER_OVERLAY = Symbol("UNREGISTER_OVERLAY");

const LOG = createLogger("map:Overlays");

export class Overlays {
    private olMap: OlMap;
    private overlays = reactiveSet<Overlay>();

    constructor(map: MapModel) {
        this.olMap = map.olMap;
    }

    // Reactive, used by renderer
    [GET_CURRENT_OVERLAYS](): Overlay[] {
        return Array.from(this.overlays);
    }

    [REGISTER_OVERLAY](overlay: Overlay) {
        if (this.overlays.has(overlay)) {
            throw new Error("Internal error: overlay is already registered");
        }
        this.overlays.add(overlay);
        this.olMap.addOverlay(overlay.olOverlay);
    }

    [UNREGISTER_OVERLAY](overlay: Overlay) {
        if (!this.overlays.has(overlay)) {
            throw new Error("Internal error: overlay was not registered");
        }
        this.overlays.delete(overlay);
        this.olMap.removeOverlay(overlay.olOverlay);
    }

    /*
    
    addOverlay({
        content: "foo",
        position: {
            kind: "mouse"
        },
        position: {
            kind: "fixed",
            // ...point
        },
        advanced: {
            // ...
        }
    })

    */

    addOverlay(properties: OverlayProperties, content: ReactNode): Overlay {
        const id = uuid4v();
        const newModel = new Overlay(id, content, properties, this);
        return newModel;
    }
}

export class Overlay {
    readonly id: string;

    // TODO: Decide whether this should be public or not
    readonly olOverlay: OlOverlay;

    #parent: Overlays;
    #isDestroyed = reactive(false);
    #content: Reactive<ReactNode>;
    #resources: Resource[];

    constructor(id: string, content: ReactNode, properties: OverlayProperties, parent: Overlays) {
        const overlayDiv = document.createElement("div");

        this.id = id;
        this.olOverlay = new OlOverlay({
            element: overlayDiv,
            id: id,
            ...properties
        });
        this.#parent = parent;
        this.#content = reactive(content);
        this.#resources = [];

        parent[REGISTER_OVERLAY](this);

        if (properties.followPointer) {
            //olMap is set after registration
            const olMap = this.olOverlay.getMap();
            if (!olMap) {
                LOG.error(`Error: Overlay ${this.olOverlay.getId()} is not registered at a map.`);
                return;
            }

            const pointerMoveKey: EventsKey = olMap.on("pointermove", (e) => {
                this.setPosition(e.coordinate);
            });
            this.#resources.push({
                destroy: () => unByKey(pointerMoveKey)
            });
        }
    }

    destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.#isDestroyed.value = true;
        this.#parent[UNREGISTER_OVERLAY](this);
        this.olOverlay.dispose();
        this.#resources.forEach((r) => r.destroy());
    }

    get isDestroyed(): boolean {
        return this.#isDestroyed.value;
    }

    // TODO: Package private? Only needed by tooltip renderer
    get content(): ReactNode {
        return this.#content.value;
    }

    get position() {
        return this.olOverlay.getPosition();
    }

    setContent(content: ReactNode): void {
        this.#content.value = content;
    }

    setPosition(position: Coordinate | undefined) {
        this.olOverlay.setPosition(position);
    }
}

export interface OverlayProperties extends Omit<Options, "id" | "element"> {
    followPointer?: boolean;
}
