// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { GroupLayerImpl } from "../../model/layers/GroupLayerImpl";
import { Layer, LayerBaseType, LayerConfig } from "./base";

export interface GroupLayerConfig extends LayerConfig {
    // TODO: layers instead of sublayers
    sublayers: Layer[]
}

export interface GroupLayerConstructor {
    prototype: GroupLayer;

    /** Creates a new {@link GroupLayer}. */
    new (config: GroupLayerConfig): GroupLayer;
}

/**
 * TODO:
 * - Start with static configuration (no adding or removing of layers after creation of the group)
 *   - Interface should be consistent with sublayers
 *   - No raw arrays / mutable objects from API
 * - Establish and maintain parent-child and child-parent links
 * - Index layer hierarchy by id (see LayerCollectionImpl)
 * - Implement group / nesting support in TOC
 * - Update documentation (layer / sublayers, examples etc.)
 *   - Document that members of the raw olLayer should not be modified directly 
 */
export interface GroupLayer extends LayerBaseType {
    readonly type: "group";

    /**
     * Children of this group layer.
     */
    readonly layers: Layer[];
    readonly sublayers: undefined;
}

export const GroupLayer: GroupLayerConstructor = GroupLayerImpl;
