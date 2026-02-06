// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Map as OlMap, Overlay as OlOverlay } from "ol";
import { MapModel } from "./MapModel";
import { Coordinate } from "ol/coordinate";
import { ReactNode } from "react";
import { reactive, Reactive, reactiveSet } from "@conterra/reactivity-core";
import { v4 as uuid4v } from "uuid";
import { createLogger, Resource } from "@open-pioneer/core";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { Options } from "ol/Overlay";

export const REGISTER_OVERLAY = Symbol("REGISTER_OVERLAY");
export const UNREGISTER_OVERLAY = Symbol("UNREGISTER_OVERLAY");

const LOG = createLogger("map:Overlays");

export class Overlays {
    private olMap: OlMap;
    private overlays = reactiveSet<Overlay>();

    constructor(map: MapModel) {
        this.olMap = map.olMap;
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

    addOverlay(properties: OverlayProperties): Overlay {
        const newModel = new Overlay(properties, this);
        return newModel;
    }

    // Reactive, used by renderer
    getOverlays(): Overlay[] {
        return Array.from(this.overlays);
    }
}

export class Overlay {
    readonly id: string;

    // TODO: Decide whether this should be public or not
    readonly olOverlay: OlOverlay;
    readonly tag?: string;

    #parent: Overlays;
    #isDestroyed = reactive(false);
    #content: Reactive<ReactNode>;
    #resources: Resource[];
    #overlayDiv: HTMLDivElement;

    constructor(properties: OverlayProperties, parent: Overlays) {
        this.id = uuid4v();
        this.tag = properties.tag;
        this.#overlayDiv = document.createElement("div");
        if (!properties.mode) {
            properties.mode = "setPosition";
        }

        const { className, ariaRole, mode, ...copyProperties } = properties;

        if (ariaRole) {
            this.#overlayDiv.role = ariaRole;
        }
        if (className) {
            this.#overlayDiv.className = className;
        }

        //simply override with advanced OL Options if set
        const mergedProperties = !copyProperties.olOptions
            ? copyProperties
            : { ...copyProperties, ...copyProperties.olOptions };

        this.olOverlay = new OlOverlay({
            element: this.#overlayDiv,
            id: this.id,
            ...mergedProperties
        });
        this.#parent = parent;
        this.#content = reactive(properties.content);
        this.#resources = [];

        parent[REGISTER_OVERLAY](this);

        if (mode === "followPointer") {
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

    get className() {
        return this.#overlayDiv.className;
    }

    get classList(){
        return this.#overlayDiv.classList;
    }

    get offset() {
        return this.olOverlay.getOffset();
    }

    get positioning(): OverlayPositioning {
        return this.olOverlay.getPositioning();
    }

    get ariaRole(): string | undefined {
        return this.#overlayDiv.role ?? undefined;
    }

    setContent(content: ReactNode): void {
        this.#content.value = content;
    }

    setPosition(position: Coordinate | undefined) {
        this.olOverlay.setPosition(position);
    }

    setClassName(className: string) {
        this.#overlayDiv.className = className;
    }

    setOffset(offset: number[]) {
        this.olOverlay.setOffset(offset);
    }

    setPositioning(positioning: OverlayPositioning) {
        this.olOverlay.setPositioning(positioning);
    }

    setAriaRole(ariaRole: string) {
        this.#overlayDiv.role = ariaRole;
    }
}

export interface OverlayProperties {
    content: ReactNode;
    mode?: "setPosition" | "followPointer";
    tag?: string;
    //rather use {x: number, y: number}? (align with set/get position)
    //initial position, Ol allows position to be undefined -> hidden
    position?: Coordinate;
    positioning?: OverlayPositioning;
    offset?: number[]; //rather use {offsetX: number, offsetY: number}?
    className?: string; //use other default than OLs "ol-overlay-container ol-selectable"?
    stopEvent?: boolean;
    ariaRole?: string; //aria role that is added to the html element
    olOptions?: OlOverlayOptions; //raw OL properties, overrides mutual properties from outer OverlayProperties (except id and element?)
}

export type OverlayPositioning =
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "center-left"
    | "center-center"
    | "center-right"
    | "top-left"
    | "top-center"
    | "top-right";

export interface OlOverlayOptions extends Omit<Options, "id" | "element"> {}
