// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Map as OlMap, Overlay as OlOverlay } from "ol";
import { MapModel } from "./MapModel";
import { Coordinate } from "ol/coordinate";
import { ReactNode } from "react";
import {
    batch,
    reactive,
    Reactive,
    reactiveSet,
    synchronized,
    watchValue
} from "@conterra/reactivity-core";
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
    #olMap: OlMap;
    #overlays = reactiveSet<Overlay>();

    constructor(map: MapModel) {
        this.#olMap = map.olMap;
    }

    [REGISTER_OVERLAY](overlay: Overlay) {
        if (this.#overlays.has(overlay)) {
            throw new Error("Internal error: overlay is already registered");
        }
        this.#overlays.add(overlay);
        this.#olMap.addOverlay(overlay.olOverlay);
    }

    [UNREGISTER_OVERLAY](overlay: Overlay) {
        if (!this.#overlays.has(overlay)) {
            throw new Error("Internal error: overlay was not registered");
        }
        this.#overlays.delete(overlay);
        this.#olMap.removeOverlay(overlay.olOverlay);
    }

    /**
     * Add new overlay to the map. Returns the newly created overlay instance.
     */
    add(options: OverlayOptions): Overlay {
        const newModel = new Overlay(INTERNAL_CONSTRUCTOR_TAG, options, this);
        return newModel;
    }

    /**
     * Returns the list of all current overlays.
     */
    getAll(): Overlay[] {
        return Array.from(this.#overlays);
    }

    /**
     * Destroys all overlays.
     */
    clear(): void {
        for (const overlay of this.#overlays) {
            overlay.destroy();
        }
    }
}

/**
 * Options that define the initial state of an overlay.
 *
 * @group Map Model
 */
export interface OverlayOptions {
    /**
     * Optional, readonly tag that helps identifying the overlay instance.
     */
    tag?: string;

    /**
     * Displayed content of the overlay.
     *
     * @see {@link Overlay.setContent}.
     */
    content?: ReactNode;

    /**
     * CSS classes of the HTML element that wraps the overlay's content.
     */
    className?: string;

    /**
     * Role of the HTML element that wraps the overlay's content.
     */
    ariaRole?: string;

    /**
     * Configures the position of the overlay.
     * The overlay is not rendered if position is `undefined` (the default).
     *
     * See {@link OverlayPosition} for all supported position options.
     *
     * The following shorthands are available:
     * - A plain `Coordinate` array can be used to specify a static coordinate on the map.
     * - `undefined` hides the overlay.
     * - `"follow-pointer"` can be used as a shorthand to follow the user's cursor.
     *
     * @see {@link Overlay.setPosition} to reconfigure the position.
     * @see {@link Overlay.currentCoordinate} to retrieve the actual position on the map.
     */
    position?: Coordinate | "follow-pointer" | OverlayPosition;

    /**
     * Positioning of an overlay relative to its coordinates on the map.
     *
     * @see {@link Overlay.setPositioning}
     */
    positioning?: OverlayPositioning;

    /**
     * Offsets in _pixels_ relative to the overlay`s coordinates on the map.
     * The first element in the array is the horizontal offset.
     *
     * @see {@link Overlay.setOffset}
     */
    offset?: number[];

    /**
     * Determines if event propagation to the map viewport should be stopped.
     *
     * By default `stopEvent` is `true`.
     */
    stopEvent?: boolean;

    /**
     * Raw OpenLayers overlay properties. `OlOverlayOptions` override corresponding `OverlayProperties`, except for id and element.
     *
     * **warning** Using OpenLayers options can create inconsistencies that lead to errors.
     * The OpenLayers API can change with updates of OpenLayers.
     */
    advanced?: OlOverlayOptions;
}

/**
 * The configured position of an overlay.
 *
 * @group Map Model
 */
export type OverlayPosition =
    /** Explicit (static) coordinates on the map. */
    | OverlayPositionCoordinate
    /** Update coordinates based on pointer movements on the map, useful for tooltips. */
    | OverlayPositionFollowPointer;

/**
 * Automatically positions the overlay on the mouse cursor's coordinates.
 *
 * This can be used, for example, to implement tooltips for map interactions.
 *
 * @group Map Model
 */
export interface OverlayPositionFollowPointer {
    kind: "follow-pointer";

    /**
     * The initial coordinates.
     *
     * Use `undefined` (the default) to hide until the first mouse event on the map.
     */
    initial?: Coordinate;
}

/**
 * Places the overlay at the given coordinates.
 *
 * @group Map Model
 */
export interface OverlayPositionCoordinate {
    kind: "coordinate";

    /**
     * The explicit coordinates of the overlay on the map.
     *
     * Using `undefined` hides the overlay.
     */
    coordinate?: Coordinate;
}

/**
 * Positioning of an overlay relative to its coordinates on the map.
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
     *
     * @see https://openlayers.org/en/latest/apidoc/module-ol_Overlay-Overlay.html
     */
    readonly olOverlay: OlOverlay;

    #parent: Overlays;
    #isDestroyed = reactive(false);
    #position = reactive<OverlayPosition>({ kind: "coordinate" });
    #content: Reactive<ReactNode>;
    #overlayDiv: HTMLDivElement;
    #resources: Resource[] = [];

    #coordinate = synchronized(
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

    constructor(internalTag: InternalConstructorTag, options: OverlayOptions, parent: Overlays) {
        if (internalTag !== INTERNAL_CONSTRUCTOR_TAG) {
            throw new Error("The overlay constructor is private.");
        }
        const {
            className,
            ariaRole,
            position,
            tag,
            content,
            offset,
            positioning,
            stopEvent,
            advanced
        } = options;
        this.id = uuid4v();
        this.tag = tag;
        this.#overlayDiv = createElement(ariaRole, className);

        this.olOverlay = new OlOverlay({
            element: this.#overlayDiv,
            id: this.id,
            offset,
            positioning,
            stopEvent,
            //simply override with advanced OL Options if set
            ...advanced
        });
        this.#parent = parent;
        this.#content = reactive(content);
        this.setPosition(position);

        parent[REGISTER_OVERLAY](this);

        this.#resources.push(
            // Update coordinate based on pointer movements when configured.
            // Automatically subscribes and unsubscribes on changes.
            watchValue(
                () => this.#position.value?.kind === "follow-pointer",
                (followPointer) => {
                    if (!followPointer) {
                        return;
                    }

                    // NOTE: If this turns out to be unstable we can also transport the map model reference here
                    // to get our olMap.
                    const olMap = this.olOverlay.getMap();
                    if (!olMap) {
                        LOG.error(
                            `Overlay ${this.olOverlay.getId()} is not registered with a map.`
                        );
                        return;
                    }

                    const pointerMoveKey: EventsKey = olMap.on("pointermove", (e) => {
                        this.olOverlay.setPosition(e.coordinate);
                    });
                    return () => unByKey(pointerMoveKey);
                },
                { immediate: true, dispatch: "sync" }
            )
        );
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
     * Current coordinates of the overlay on the map.
     *
     * The coordinates on the map are configured via {@link OverlayOptions.position} or {@link setPosition}.
     *
     * - If configured with static coordinates (i.e. `position.kind === "coordinate"`), this is
     *   the same as `position.coordinate`.
     * - If configured with `"follow-pointer"` position, this is the result of the user's pointer movements.
     */
    get currentCoordinate(): Coordinate | undefined {
        return this.#coordinate.value;
    }

    /**
     * The content of the overlay that is currently rendered.
     */
    get content(): ReactNode {
        return this.#content.value;
    }

    /**
     * The HTML element that that wraps the overlay's content.
     */
    get element(): HTMLElement {
        return this.#overlayDiv;
    }

    /**
     * Offset in _pixels_ relative to the overlay`s coordinates.
     *
     * The first element in the array is the horizontal offset.
     */
    get offset(): number[] {
        return this.#offset.value;
    }

    /**
     * The configured position of the overlay on the map.
     *
     * See also {@link currentCoordinate} to get the coordinate
     * that are the result of this configuration.
     *
     * > NOTE: The return value of the getter may not be the same
     * > as the input to the setter (or constructor) due to normalization.
     */
    get position(): OverlayPosition {
        return this.#position.value;
    }

    /**
     * Positioning of an overlay relative to its coordinates on the map.
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
     * Set the position of the overlay.
     *
     * This controls the coordinates of the map.
     * The overlay is not rendered if the coordinates are `undefined`.
     *
     * See also {@link currentCoordinate} to get the coordinates
     * that are the result of this configuration.
     *
     * @see {@link OverlayPosition}
     */
    setPosition(position: OverlayOptions["position"]) {
        const normalized = normalizePosition(position);

        let newCoordinate: Coordinate | undefined;
        if (normalized) {
            if (normalized.kind === "coordinate") {
                newCoordinate = normalized.coordinate;
            } else {
                newCoordinate = normalized.initial;
                // mouse event handler will update this on its own
            }
        }

        batch(() => {
            this.#position.value = normalized;
            this.olOverlay.setPosition(newCoordinate);
        });
    }

    /**
     * Set offset in _pixels_ relative to the overlay`s coordinates on the map.
     * The first element in the array is the horizontal offset.
     */
    setOffset(offset: number[]) {
        this.olOverlay.setOffset(offset);
    }

    /**
     * Set positioning of an overlay relative to its coordinates on the map.
     */
    setPositioning(positioning: OverlayPositioning) {
        this.olOverlay.setPositioning(positioning);
    }
}

function normalizePosition(position: OverlayOptions["position"]): OverlayPosition {
    if (!position || Array.isArray(position)) {
        return { kind: "coordinate", coordinate: position };
    }
    if (position === "follow-pointer") {
        return { kind: "follow-pointer" };
    }
    if (typeof position !== "object") {
        throw new Error("Unexpected position: " + position);
    }
    return position;
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
