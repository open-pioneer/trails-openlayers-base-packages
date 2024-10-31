// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Group } from "ol/layer";
import { GroupLayer, GroupLayerConfig } from "../../api/layers/GroupLayer";
import { AbstractLayer } from "../AbstractLayer";
import { GroupLayerCollectionImpl } from "../GroupLayerCollectionImpl";

export class GroupLayerImpl extends AbstractLayer implements GroupLayer {
    #children: GroupLayerCollectionImpl;

    constructor(config: GroupLayerConfig) {
        const groupLayers = config.layers;
        const olGroup = new Group({ layers: groupLayers.map((sublayer) => sublayer.olLayer) });
        super({ ...config, olLayer: olGroup });

        this.#children = new GroupLayerCollectionImpl(groupLayers, this);
    }

    get type() {
        return "group" as const;
    }

    get legend() {
        return undefined;
    }

    get layers(): GroupLayerCollectionImpl {
        return this.#children;
    }

    get sublayers(): undefined {
        return undefined;
    }

    /**
     * return raw OL LayerGroup
     * Warning: Do not manipulate the collection of layers in this group, changes are not synchronized!
     */
    get olLayer(): Group {
        return super.olLayer as Group;
    }
}
