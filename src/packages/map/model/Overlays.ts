// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Map as OlMap, Overlay as OlOverlay } from "ol";
import { MapModel } from "./MapModel";
import { Coordinate } from "ol/coordinate";
import { ReactNode } from "react";
import { batch, reactive, Reactive, reactiveSet, synchronized } from "@conterra/reactivity-core";
import { v4 as uuid4v } from "uuid";
import { createLogger, destroyResources, Resource } from "@open-pioneer/core";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import { Options } from "ol/Overlay";
import { sourceId } from "open-pioneer:source-info";
import { INTERNAL_CONSTRUCTOR_TAG, InternalConstructorTag } from "../utils/InternalConstructorTag";

export const REGISTER_OVERLAY = Symbol("REGISTER_OVERLAY");
export const UNREGISTER_OVERLAY = Symbol("UNREGISTER_OVERLAY");

const LOG = createLogger(sourceId);

/**
 * Manages active overlays on the map.
 *
 * @group Map Model
 */
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
    add(properties: OverlayProperties): Overlay {
        const newModel = new Overlay(INTERNAL_CONSTRUCTOR_TAG, properties, this);
        return newModel;
    }

    /**
     * Returns list of all current overlays.
     */
    getAll(): Overlay[] {
        return Array.from(this.overlays);
    }
}

/**
 * Properties that define the initial state of an overlay.
 *
 * @group Map Model
 */
export interface OverlayProperties {
    /**
     * Optional, readonly tag that helps identifying the overlay instance
     */
    tag?: string;

    /**
     * Displayed content of the overlay.
     */
    content?: ReactNode;

    /**
     * CSS classes of the HTMLDivElement that wraps the overlay's content.
     */
    className?: string;

    /**
     * Role of the HTMLDivElement that wraps the overlay's content.
     */
    ariaRole?: string;

    /**
     * If mode is `set-position` the overlay remains at the provided position. The position can be changed manually by calling `setPosition` on the overlay instance.
     * If mode is `follow-pointer` the position is automatically updated to pointer position (coordinates) on the map.
     *
     * By default the mode is `set-position`.
     */
    mode?: "set-position" | "follow-pointer"; //ToDo there might be a better name instead of set-position

    /**
     * Initial position of the overlay. Overlay is not rendered if position is `undefined`.
     * Can be overridden immediately if `mode` is `follow-pointer`
     *
     * ToDo: Makes no sense to provide coordinate if mode is follow-pointer, How to model this with Typescript? (also setPosition of Overlay)
     */
    position?: Coordinate;

    /**
     * Positioning of an overlay relative to its position (coordinates).
     */
    positioning?: OverlayPositioning;

    /**
     * Offsets in pixels relative to the overlay`s position (coordinates).
     * The first element in the array is the horizontal offset.
     */
    offset?: number[];

    /**
     * Determines if event propagation to the map viewport should be stopped.
     *
     * By default `stopEvent` is `true`.
     */
    stopEvent?: boolean;

    /**
     * Raw OpenLayers overlay properties. `OlOverlayOptions` override corresponding `OverlayProperties` except id and element.
     *
     * **warning** Using OpenLayers options can create inconsistencies that lead to errors. The OpenLayers API can change with updates of OpenLayers.
     */
    advanced?: OlOverlayOptions; //raw OL properties, overrides mutual properties from outer OverlayProperties (except id and element?)
}

/**
 * Positioning of an overlay relative to its position (coordinates).
 *
 * @group Map Model
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

/** @group Map Model */
export interface OlOverlayOptions extends Omit<Partial<Options>, "id" | "element"> {}

/**
 * An overlay is an UI element that is displayed over the map.
 *
 * Overlays are tied to coordinates on the map and not to a position on the screen.
 * The overlay renders a react node at the specified coordinates.
 *
 * @group Map Model
 */
export class Overlay {
    /**
     * Unique, readonly id of the overlay.
     *
     * Automatically assigned when the overlay is created. Use the `tag` property for custom identifiers.
     */
    readonly id: string;

    /**
     * Optional, readonly tag that helps identifying the overlay instance.
     */
    readonly tag: string | undefined;

    /**
     * Raw, corresponding OpenLayers overlay object.
     *
     * **warning** Manipulation of the OpenLayers object can create inconsistencies that lead to errors. The OpenLayers API can change with updates of OpenLayers.
     */
    readonly olOverlay: OlOverlay;

    #parent: Overlays;
    #isDestroyed = reactive(false);
    #content: Reactive<ReactNode>;
    #resources: Resource[];
    #overlayDiv: HTMLDivElement;

    #position = synchronized(
        () => this.olOverlay.getPosition(),
        (cb) => {
            const key = this.olOverlay.on("change:position", cb);
            return () => unByKey(key);
        }
    );
    #positioning = synchronized(
        () => this.olOverlay.getPositioning(),
        (cb) => {
            const key = this.olOverlay.on("change:positioning", cb);
            return () => unByKey(key);
        }
    );
    #offset = synchronized(
        () => this.olOverlay.getOffset(),
        (cb) => {
            const key = this.olOverlay.on("change:offset", cb);
            return () => unByKey(key);
        }
    );

    constructor(
        internalTag: InternalConstructorTag,
        properties: OverlayProperties,
        parent: Overlays
    ) {
        if (internalTag !== INTERNAL_CONSTRUCTOR_TAG) {
            throw new Error("The overlay constructor is private.");
        }

        const { className, ariaRole, mode, ...copyProperties } = properties;
        this.id = uuid4v();
        this.tag = properties.tag;
        this.#overlayDiv = createElement(ariaRole, className);

        if (!properties.mode) {
            properties.mode = "set-position";
        }

        //simply override with advanced OL Options if set
        const mergedProperties = !copyProperties.advanced
            ? copyProperties
            : { ...copyProperties, ...copyProperties.advanced };

        this.olOverlay = new OlOverlay({
            element: this.#overlayDiv,
            id: this.id,
            ...mergedProperties
        });
        this.#parent = parent;
        this.#content = reactive(properties.content);
        this.#resources = [];

        parent[REGISTER_OVERLAY](this);

        if (mode === "follow-pointer") {
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
     * Destroys the overlay and removes it from the map.
     * An overlay that is destroyed cannot be added to the map again.
     */
    destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        batch(() => {
            this.#isDestroyed.value = true;
            this.#parent[UNREGISTER_OVERLAY](this);
            this.olOverlay.dispose();
            destroyResources(this.#resources);
        });
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
     * Current position (coordinates) of the overlay.
     */
    get position(): Coordinate | undefined {
        return this.#position.value;
    }

    /**
     * The HTMLDivElement that that wraps the overlay's content.
     */
    get element(): HTMLElement {
        return this.#overlayDiv;
    }

    /**
     * Offsets in pixels relative to the overlay`s position. The first element in the array is the horizontal offset.
     */
    get offset(): number[] {
        return this.#offset.value;
    }

    /**
     * Positioning of an overlay relative to its position (coordinates).
     */
    get positioning(): OverlayPositioning {
        return this.#positioning.value;
    }

    /**
     * Set new content that is rendered on the overlay.
     */
    setContent(content: ReactNode): void {
        this.#content.value = content;
    }

    /**
     * Set the coordinates of the overlay. The overlay is not rendered if the position is `undefined`.
     *
     * Can be overridden immediately if the overlay's `mode` is `follow-pointer` (see {@link OverlayProperties}).
     */
    setPosition(position: Coordinate | undefined) {
        this.olOverlay.setPosition(position);
    }

    /**
     * Set offset in pixels relative to the overlay`s position. The first element in the array is the horizontal offset.
     */
    setOffset(offset: number[]) {
        this.olOverlay.setOffset(offset);
    }

    /**
     * Set positioning of an overlay relative to its position (coordinates)
     */
    setPositioning(positioning: OverlayPositioning) {
        this.olOverlay.setPositioning(positioning);
    }
}

function createElement(ariaRole: string | undefined, classNameProp: string | undefined) {
    const overlayDiv = document.createElement("div");
    if (ariaRole) {
        overlayDiv.role = ariaRole;
    }

    let className = "map-overlay";
    if (classNameProp) {
        className += ` ${classNameProp}`;
    }
    overlayDiv.className = className;
    return overlayDiv;
}
