// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { deprecated } from "@open-pioneer/core";
import { Group } from "ol/layer";
import type { LayerFactory } from "../LayerFactory";
import { MapModel } from "../model/MapModel";
import { INTERNAL_CONSTRUCTOR_TAG, InternalConstructorTag } from "../utils/InternalConstructorTag";
import { AbstractLayer } from "./AbstractLayer";
import { GroupLayerCollection } from "./group/GroupLayerCollection";
import { LayerConfig } from "./shared/LayerConfig";
import {
    ATTACH_TO_MAP,
    DETACH_FROM_MAP,
    GET_RAW_LAYERS,
    LayerConstructor,
    LayerDependencies
} from "./shared/internals";
import { Layer } from "./unions";

/**
 * Configuration options to construct a {@link GroupLayer}.
 *
 * @group Layers
 */
export interface GroupLayerConfig extends LayerConfig {
    /**
     * List of layers that belong to the new group layer.
     *
     * The group layer takes ownership of the given layers: they will be destroyed when the parent is destroyed.
     * A layer must have a unique parent: it can only be added to the map or a single group layer.
     */
    layers: Layer[];
}

const deprecatedConstructor = deprecated({
    name: "GroupLayer constructor",
    packageName: "@open-pioneer/map",
    since: "v1.0.0",
    alternative: "use LayerFactory.create() instead"
});

/**
 * Represents a group of layers.
 *
 * A group layer contains a collection of {@link Layer} children.
 * Groups can be nested to form a hierarchy.
 *
 * @group Layers
 */
export class GroupLayer extends AbstractLayer {
    #children: GroupLayerCollection;

    /**
     * @deprecated Prefer using {@link LayerFactory.create} instead of calling the constructor directly
     */
    constructor(config: GroupLayerConfig);

    /**
     * NOTE: Do not use this overload. Use {@link LayerFactory.create} instead.
     *
     * @internal
     */
    constructor(
        config: GroupLayerConfig,
        deps: LayerDependencies,
        internalTag: InternalConstructorTag
    );

    constructor(
        config: GroupLayerConfig,
        deps?: LayerDependencies,
        internalTag?: InternalConstructorTag
    ) {
        if (!internalTag) {
            deprecatedConstructor();
        }

        const groupLayers = config.layers;
        const olGroup = new Group({ layers: groupLayers.map((sublayer) => sublayer.olLayer) });
        super({ ...config, olLayer: olGroup }, deps, internalTag);
        this.#children = new GroupLayerCollection(groupLayers, this, INTERNAL_CONSTRUCTOR_TAG);
    }

    override get type() {
        return "group" as const;
    }

    override get legend() {
        return undefined;
    }

    /**
     * Layers contained in this group.
     */
    override get layers(): GroupLayerCollection {
        return this.#children;
    }

    override get sublayers(): undefined {
        return undefined;
    }

    /**
     * Raw OpenLayers group instance.
     *
     * **Warning:** Do not manipulate the collection of layers in this group directly, changes are not synchronized!
     */
    override get olLayer(): Group {
        return super.olLayer as Group;
    }

    /** @internal */
    override [ATTACH_TO_MAP](map: MapModel): void {
        super[ATTACH_TO_MAP](map);
        this.layers[GET_RAW_LAYERS]().forEach((layer) => layer[ATTACH_TO_MAP](map));
    }

    /** @internal */
    override [DETACH_FROM_MAP](): void {
        super[DETACH_FROM_MAP]();
        this.layers[GET_RAW_LAYERS]().forEach((layer) => layer[DETACH_FROM_MAP]());
    }
}

// Ensure layer class is assignable to the constructor interface (there is no "implements" for the class itself).
// eslint-disable-next-line no-constant-condition
if (false) {
    const check: LayerConstructor<GroupLayerConfig, GroupLayer> = GroupLayer;
    void check;
}
