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

    /**
     * Add new overlay to the map. Returns the newly created overlay instance.
     */
    addOverlay(properties: OverlayProperties): Overlay {
        const newModel = new Overlay(properties, this);
        return newModel;
    }

    /**
     * Returns list of all current overlays.
     */
    getOverlays(): Overlay[] {
        return Array.from(this.overlays);
    }
}

/**
 * An overlay is an UI element that is displayed over the map. Overlays are tied to coordinates on the map and not to a position on the screen.
 * The displayed content of an overlay is a ReactNode. Therefore, it can be simple text content or a complex React component.
 */
export class Overlay {
    /**
     * Unique, readonly id of the overlay. Automatically assigned when the overlay is created. Use the `tag` property for custom identifiers.
     */
    readonly id: string;
    /**
     * Optional, readonly tag that helps identifying the overlay instance
     */
    readonly tag?: string;
    /**
     * Raw, corresponding OpenLayers overlay object
     *
     * **warning** Manipulation of the OpenLayers object can create inconsistencies that lead to errors. The OpenLayers API can change with updates of OpenLayers.
     */
    readonly olOverlay: OlOverlay;

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

    /**
     * Destroys the overlay and removes it from the maps.
     * An overlay that is destroyed cannot be added to the map again.
     */
    destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.#isDestroyed.value = true;
        this.#parent[UNREGISTER_OVERLAY](this);
        this.olOverlay.dispose();
        this.#resources.forEach((r) => r.destroy());
    }

    /**
     * Indicates if the overlay instance has been destroyed.
     */
    get isDestroyed(): boolean {
        return this.#isDestroyed.value;
    }

    /**
     * The content of the overlay that is currently rendered.
     */
    get content(): ReactNode {
        return this.#content.value;
    }

    /**
     * Current position (coordinates) of the overlay
     */
    get position() {
        return this.olOverlay.getPosition();
    }

    /**
     * The `className` attribute of the `HTMLDivElement` that wraps the overlay's content
     */
    get className() {
        return this.#overlayDiv.className;
    }

    /**
     * The `classList` attribute of the `HTMLDivElement` that wraps the overlay's content
     */
    get classList() {
        return this.#overlayDiv.classList;
    }

    /**
     * Offsets in pixels relative to the overlay`s position. The first element in the array is the horizontal offset.
     */
    get offset() {
        return this.olOverlay.getOffset();
    }

    /**
     * Positioning of an overlay relative to its position (coordinates)
     */
    get positioning(): OverlayPositioning {
        return this.olOverlay.getPositioning();
    }

    /**
     * The `role` attribute of the `HTMLDivElement` that wraps the overlay's content
     */
    get ariaRole(): string | undefined {
        return this.#overlayDiv.role ?? undefined;
    }

    /**
     * Set new content that is rendered on the overlay.
     */
    setContent(content: ReactNode): void {
        this.#content.value = content;
    }

    /**
     * Set the coordinates of the overlay. The overlay is not rendered if the position is `undefined`.
     * Can be overriden immediately if the overlay's `mode` is `followPointer` (see {@link OverlayProperties}).
     */
    setPosition(position: Coordinate | undefined) {
        this.olOverlay.setPosition(position);
    }

    /**
     * Set `className` attribute of the `HTMLDivElement` that wraps the overlay's content
     */
    setClassName(className: string) {
        this.#overlayDiv.className = className;
    }

    /**
     * Set offset in pixels relative to the overlay`s position. The first element in the array is the horizontal offset.
     */
    setOffset(offset: number[]) {
        this.olOverlay.setOffset(offset);
    }

    /**
     * Set Positioning of an overlay relative to its position (coordinates)
     */
    setPositioning(positioning: OverlayPositioning) {
        this.olOverlay.setPositioning(positioning);
    }

    /**
     * Set the `role` attribute of the HTMLDivElement that wraps the overlay's content
     */
    setAriaRole(ariaRole: string) {
        this.#overlayDiv.role = ariaRole;
    }
}

/**
 * Properties that define the initial state of an overlay
 */
export interface OverlayProperties {
    /**
     * Displayed content of the overlay
     */
    content: ReactNode;
    /**
     * If mode is `setPosition` the overlay remains at the provided position. The position can be changed manually by calling `setPosition` on the overlay instance.
     * If mode is `followPointer` the position is automatically updated to pointer position on the map.
     *
     * By default the mode is `setPosition`.
     */
    mode?: "setPosition" | "followPointer";
    /**
     * Optional, readonly tag that helps identifying the overlay instance
     */
    tag?: string;
    /**
     * Initial position of the overlay. Overlay is not rendered if position is `undefined`.
     * Can be overridden immediately if `mode` is `followPointer`
     */
    position?: Coordinate;
    /**
     * Positioning of an overlay relative to its position (coordinates)
     */
    positioning?: OverlayPositioning;
    /**
     * Offsets in pixels relative to the overlay`s position. The first element in the array is the horizontal offset.
     */
    offset?: number[]; //rather use {offsetX: number, offsetY: number}?
    /**
     * CSS classes of the HTMLDIVElement that wraps the overlay's content
     */
    className?: string;
    /**
     * Determines if event propagation to the map viewport should be stopped
     *
     * By default `stopEvent` is `true`
     */
    stopEvent?: boolean;
    /**
     * Role of the HTMLDIVElement that wraps the overlay's content
     */
    ariaRole?: string;
    /**
     * Raw Openlayers overlay properties. `OlOverlayOptions` override corresponding `OverlayProperties` except id and element.
     *
     * **warning** Using OpenLayers options can create inconsistencies that lead to errors. The OpenLayers API can change with updates of OpenLayers.
     */
    olOptions?: OlOverlayOptions; //raw OL properties, overrides mutual properties from outer OverlayProperties (except id and element?)
}

/**
 * Positioning of an overlay relative to its position (coordinates)
 */
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
