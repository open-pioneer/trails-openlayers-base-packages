// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { EventEmitter, EventNames, createLogger } from "@open-pioneer/core";
import { v4 as uuid4v } from "uuid";
import { AnyLayerBaseType, AnyLayerTypes, LayerBaseEvents, Sublayer } from "../api";
import { MapModelImpl } from "./MapModelImpl";
import { SublayersCollectionImpl } from "./SublayersCollectionImpl";

const LOG = createLogger("map:AbstractLayerModel");

export interface AbstractLayerBaseOptions {
    id?: string;
    title: string;
    description?: string;
    attributes?: Record<string, unknown>;
}

/**
 * Base class for "normal" layers and sublayers alike to implement common properties
 * such as id, title and attributes.
 */
export abstract class AbstractLayerBase<AdditionalEvents = {}>
    extends EventEmitter<LayerBaseEvents & AdditionalEvents>
    implements AnyLayerBaseType
{
    #map: MapModelImpl | undefined;

    #id: string;
    #title: string;
    #description: string;
    #attributes: Record<string | symbol, unknown>;
    #destroyed = false;

    constructor(config: AbstractLayerBaseOptions) {
        super();
        this.#id = config.id ?? uuid4v();
        this.#attributes = config.attributes ?? {};
        this.#title = config.title;
        this.#description = config.description ?? "";
    }

    protected get __destroyed(): boolean {
        return this.#destroyed;
    }

    get map(): MapModelImpl {
        const map = this.#map;
        if (!map) {
            throw new Error(`Layer '${this.id}' has not been attached to a map yet.`);
        }
        return map;
    }

    get id(): string {
        return this.#id;
    }

    get title(): string {
        return this.#title;
    }

    get description(): string {
        return this.#description;
    }

    get attributes(): Record<string | symbol, unknown> {
        return this.#attributes;
    }

    abstract get type(): AnyLayerTypes;

    abstract get visible(): boolean;

    abstract get sublayers(): SublayersCollectionImpl<Sublayer & AbstractLayerBase> | undefined;

    abstract get legend(): string | undefined;

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        this.sublayers?.destroy();
        try {
            this.emit("destroy");
        } catch (e) {
            LOG.warn(`Unexpected error from event listener during layer destruction:`, e);
        }
    }

    /**
     * Attaches the layer to its owning map.
     */
    protected __attachToMap(map: MapModelImpl): void {
        if (this.#map) {
            throw new Error(
                `Layer '${this.id}' has already been attached to the map '${this.map.id}'`
            );
        }
        this.#map = map;
    }

    setTitle(newTitle: string): void {
        if (newTitle !== this.#title) {
            this.#title = newTitle;
            this.__emitChangeEvent("changed:title");
        }
    }

    setDescription(newDescription: string): void {
        if (newDescription !== this.#description) {
            this.#description = newDescription;
            this.__emitChangeEvent("changed:description");
        }
    }

    updateAttributes(newAttributes: Record<string | symbol, unknown>): void {
        const attributes = this.#attributes;
        const keys = Reflect.ownKeys(newAttributes);

        let changed = false;
        for (const key of keys) {
            const existing = attributes[key];
            const value = newAttributes[key];
            if (existing !== value) {
                attributes[key] = value;
                changed = true;
            }
        }

        if (changed) {
            this.__emitChangeEvent("changed:attributes");
        }
    }

    deleteAttribute(deleteAttribute: string | symbol): void {
        const attributes = this.#attributes;
        if (attributes[deleteAttribute]) {
            delete attributes[deleteAttribute];
            this.__emitChangeEvent("changed:attributes");
        }
    }

    abstract setVisible(newVisibility: boolean): void;

    protected __emitChangeEvent<Name extends EventNames<LayerBaseEvents & AdditionalEvents>>(
        event: Name
    ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).emit(event);
        this.emit("changed");
    }
}
