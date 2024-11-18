// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Group } from "ol/layer";
import { GroupLayerImpl } from "../../model/layers/GroupLayerImpl";
import type { GroupLayerCollection, Layer, LayerBaseType, LayerConfig } from "./base";

/**
 * Configuration options to construct a {@link GroupLayer}.
 */
export interface GroupLayerConfig extends LayerConfig {
    /**
     * List of layer that belong to group layer.
     * As long as a layer is attached to a group it cannot be added to the map model directly.
     */
    layers: Layer[];
}

/**
 * Represents a group of layers.
 * A group layer contains a collection of {@link Layer} instances, nesting of group layers is also possible.
 */
export interface GroupLayer extends LayerBaseType {
    readonly type: "group";

    /**
     * layers contained in this group.
     */
    readonly layers: GroupLayerCollection;

    /**
     * raw OL LayerGroup
     * Warning: Do not manipulate the collection of layers in this group, changes are not synchronized!
     */
    readonly olLayer: Group;

    readonly sublayers: undefined;
}

export interface GroupLayerConstructor {
    prototype: GroupLayer;

    /** Creates a new {@link GroupLayer}. */
    new (config: GroupLayerConfig): GroupLayer;
}

export const GroupLayer: GroupLayerConstructor = GroupLayerImpl;
