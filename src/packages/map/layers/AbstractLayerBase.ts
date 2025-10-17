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
import { emit, emitter, EventSource } from "@conterra/reactivity-events";
import { v4 as uuid4v } from "uuid";
import { MapModel } from "../model/MapModel";
import { GroupLayer } from "./GroupLayer";
import { GroupLayerCollection } from "./group/GroupLayerCollection";
import { ChildrenCollection } from "./shared/ChildrenCollection";
import { SublayersCollection } from "./shared/SublayersCollection";
import { AnyLayer, AnyLayerTypes, Sublayer } from "./unions";

export interface AbstractLayerBaseOptions {
    id?: string;
    title: string;
    description?: string;
    attributes?: Record<string, unknown>;
    internal?: boolean;
}

/**
 * Interface shared by all layer types (operational layers and sublayers).
 *
 * Instances of this interface cannot be constructed directly; use a real layer
 * class such as {@link SimpleLayer} instead.
 */
export abstract class AbstractLayerBase {
    #map = reactive<MapModel>();
    #parent: AnyLayer | undefined;

    #id: string;
    #title: Reactive<string>;
    #description: Reactive<string>;
    #attributesMap = reactiveMap<string | symbol, unknown>();
    #attributes: ReadonlyReactive<Record<string | symbol, unknown>>;
    #isDestroyed = reactive(false);
    #internal: Reactive<boolean>;

    #destroyed = emitter();

    constructor(config: AbstractLayerBaseOptions) {
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

    /**
     * Destroys the layer and everything owned by it.
     *
     * > NOTE: Layers that are part of the map will be destroyed automatically
     * > when that map is being destroyed.
     */
    destroy() {
        if (this.#isDestroyed.value) {
            return;
        }

        batch(() => {
            this.#isDestroyed.value = true;
            this.sublayers?.destroy();
            this.layers?.destroy();
            emit(this.#destroyed);
        });
    }

    /** True if the layer has been destroyed. */
    get isDestroyed() {
        return this.#isDestroyed.value;
    }

    /**
     * Emits an event when the layer is destroyed.
     */
    get destroyed(): EventSource<void> {
        return this.#destroyed;
    }

    /**
     * The unique id of this layer within its map model.
     *
     * NOTE: layer ids may not be globally unique: layers that belong
     * to different map models may have the same id.
     */
    get id(): string {
        return this.#id;
    }

    /** The human-readable title of this layer. */
    get title(): string {
        return this.#title.value;
    }

    /** The human-readable description of this layer. May be empty. */
    get description(): string {
        return this.#description.value;
    }

    /**
     * Property that specifies if the layer is an "internal" layer. Internal layers are not considered by any UI widget (e.g. Toc or Legend).
     * The internal state is independent of the layer's visibility which is determined by {@link visible}
     *
     * NOTE: Some UI widgets might use component specific attributes or props that have precedence over the internal property.
     */
    get internal(): boolean {
        return this.#internal.value;
    }

    /**
     * Additional attributes associated with this layer.
     *
     * NOTE: Do not modify vis this getter.
     * Use {@link updateAttributes} or {@link deleteAttribute} instead.
     */
    get attributes(): Record<string | symbol, unknown> {
        return this.#attributes.value;
    }

    /**
     * The map this layer belongs to.
     *
     * NOTE: Throws if the layer is not part of a map.
     */
    get map(): MapModel {
        const map = this.nullableMap;
        if (!map) {
            throw new Error(`Layer '${this.id}' has not been attached to a map yet.`);
        }
        return map;
    }

    /**
     * The map this layer belongs to, or undefined if the layer is not part of a map.
     */
    get nullableMap(): MapModel | undefined {
        return this.#map.value;
    }

    /**
     * The direct parent of this layer instance, used for sublayers or for layers in a group layer.
     *
     * The property shall be undefined if the layer is not a sublayer or member of a group layer.
     */
    get parent(): AnyLayer | undefined {
        return this.#parent;
    }

    /**
     * The direct children of this layer.
     *
     * The children may either be a set of operational layers (e.g. for a group layer) or a set of sublayers, or `undefined`.
     *
     * See also {@link layers} and {@link sublayers}.
     */
    get children(): ChildrenCollection<AnyLayer> | undefined {
        return this.layers ?? this.sublayers ?? undefined;
    }

    /**
     * Identifies the type of this layer.
     */
    abstract get type(): AnyLayerTypes;

    /**
     * Whether the layer is visible or not.
     *
     * NOTE: The model's visible state may do more than influence the raw OpenLayers's visibility property.
     * Future versions may completely remove invisible layers from the OpenLayer's map under some circumstances.
     */
    abstract get visible(): boolean;

    /**
     * If this layer is a group layer this property contains a collection of all layers that a members to the group.
     *
     * The property shall be `undefined` if it is not a group layer.
     *
     * The properties `layers` and `sublayers` are mutually exclusive.
     */
    abstract get layers(): GroupLayerCollection | undefined;

    /**
     * The collection of child sublayers for this layer. Sublayers are layers that cannot exist without an appropriate parent layer.
     *
     * Layers that can never have any sublayers may not have a `sublayers` collection.
     *
     * The properties `layers` and `sublayers` are mutually exclusive.
     */
    abstract get sublayers(): SublayersCollection<Sublayer> | undefined;

    /**
     * Legend URL from the service capabilities, if available.
     *
     * Note: this property may be expanded upon in the future, e.g. to support more variants than just image URLs.
     */
    abstract get legend(): string | undefined;

    /**
     * Attaches the layer to its owning map.
     */
    __attachToMap(map: MapModel): void {
        if (this.#map.value) {
            throw new Error(
                `Layer '${this.id}' has already been attached to the map '${this.map.id}'`
            );
        }
        this.#map.value = map;
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
     * Called when a layer is removed from the map.
     */
    __detachFromMap(): void {
        this.#map.value = undefined;
    }

    /**
     * Detach layer from parent group layer.
     *
     * Called by the parent group layer when destroyed or the layer gets removed.
     */
    __detachFromGroup(): void {
        this.#parent = undefined;
    }

    /**
     * Updates the title of this layer.
     */
    setTitle(newTitle: string): void {
        this.#title.value = newTitle;
    }

    /**
     * Updates the description of this layer.
     */
    setDescription(newDescription: string): void {
        this.#description.value = newDescription;
    }

    /**
     * Updates the internal property of this layer to the new value.
     */
    setInternal(newIsInternal: boolean): void {
        this.#internal.value = newIsInternal;
    }

    /**
     * Updates the attributes of this layer.
     * Values in `newAttributes` will override existing values with the same key.
     */
    updateAttributes(newAttributes: Record<string | symbol, unknown>): void {
        const keys = Reflect.ownKeys(newAttributes);
        batch(() => {
            for (const key of keys) {
                this.#attributesMap.set(key, newAttributes[key]);
            }
        });
    }

    /**
     * Deletes the attribute of this layer.
     */
    deleteAttribute(deleteAttribute: string | symbol): void {
        this.#attributesMap.delete(deleteAttribute);
    }

    /**
     * Updates the visibility of this layer to the new value.
     *
     * NOTE: The visibility of base layers cannot be changed through this method.
     * Call {@link LayerCollection.activateBaseLayer} instead.
     */
    abstract setVisible(newVisibility: boolean): void;
}
