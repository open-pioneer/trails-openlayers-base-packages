// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    batch,
    computed,
    reactive,
    Reactive,
    reactiveMap,
    ReadonlyReactive
} from "@conterra/reactivity-core";
import { createLogger, EventEmitter } from "@open-pioneer/core";
import { v4 as uuid4v } from "uuid";
import {
    AnyLayer,
    AnyLayerBaseType,
    AnyLayerTypes,
    ChildrenCollection,
    LayerBaseEvents,
    Sublayer
} from "../api";
import { GroupLayer } from "../api/layers/GroupLayer";
import { GroupLayerCollectionImpl } from "./layers/GroupLayerImpl";
import { MapModelImpl } from "./MapModelImpl";
import { SublayersCollectionImpl } from "./SublayersCollectionImpl";

const LOG = createLogger("map:AbstractLayerModel");

export interface AbstractLayerBaseOptions {
    id?: string;
    title: string;
    description?: string;
    attributes?: Record<string, unknown>;
    internal?: boolean;
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
    #parent: AnyLayer | undefined;

    #id: string;
    #title: Reactive<string>;
    #description: Reactive<string>;
    #attributesMap = reactiveMap<string | symbol, unknown>();
    #attributes: ReadonlyReactive<Record<string | symbol, unknown>>;
    #destroyed = false;
    #internal: Reactive<boolean>;

    constructor(config: AbstractLayerBaseOptions) {
        super();
        this.#id = config.id ?? uuid4v();
        this.#attributes = computed(() => {
            return Object.fromEntries(this.#attributesMap.entries());
        });
        this.#title = reactive(config.title);
        this.#description = reactive(config.description ?? "");
        this.#internal = reactive(config.internal ?? false);

        if (config.attributes) {
            this.updateAttributes(config.attributes);
        }
    }

    get internal(): boolean {
        return this.#internal.value;
    }

    setInternal(newIsInternal: boolean): void {
        this.#internal.value = newIsInternal;
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
        return this.#title.value;
    }

    get description(): string {
        return this.#description.value;
    }

    get attributes(): Record<string | symbol, unknown> {
        return this.#attributes.value;
    }

    get parent(): AnyLayer | undefined {
        return this.#parent;
    }

    get children(): ChildrenCollection<AnyLayer & AbstractLayerBase> | undefined {
        return this.layers ?? this.sublayers ?? undefined;
    }

    abstract get type(): AnyLayerTypes;

    abstract get visible(): boolean;

    abstract get layers(): GroupLayerCollectionImpl | undefined;

    abstract get sublayers(): SublayersCollectionImpl<Sublayer & AbstractLayerBase> | undefined;

    abstract get legend(): string | undefined;

    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.#destroyed = true;
        this.sublayers?.destroy();
        this.layers?.destroy();
        try {
            this.emit("destroy");
        } catch (e) {
            LOG.warn(`Unexpected error from event listener during layer destruction:`, e);
        }
    }

    /**
     * Attaches the layer to its owning map.
     */
    __attachToMap(map: MapModelImpl): void {
        if (this.#map) {
            throw new Error(
                `Layer '${this.id}' has already been attached to the map '${this.map.id}'`
            );
        }
        this.#map = map;
    }

    /**
     * Attach group layers to its parent group layer.
     * Called by the parent layer.
     */
    __attachToGroup(parent: GroupLayer): void {
        if (this.#parent) {
            throw new Error(
                `Layer '${this.id}' has already been attached to the group layer '${this.#parent.id}'`
            );
        }
        this.#parent = parent;
    }

    /**
     * Detach layer from parent group layer.
     *
     * Called by the parent group layer when destroyed or the layer gets removed.
     */
    __detachFromGroup(): void {
        this.#parent = undefined;
    }

    setTitle(newTitle: string): void {
        this.#title.value = newTitle;
    }

    setDescription(newDescription: string): void {
        this.#description.value = newDescription;
    }

    updateAttributes(newAttributes: Record<string | symbol, unknown>): void {
        const keys = Reflect.ownKeys(newAttributes);
        batch(() => {
            for (const key of keys) {
                this.#attributesMap.set(key, newAttributes[key]);
            }
        });
    }

    deleteAttribute(deleteAttribute: string | symbol): void {
        this.#attributesMap.delete(deleteAttribute);
    }

    abstract setVisible(newVisibility: boolean): void;
}
