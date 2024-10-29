// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Group } from "ol/layer";
import { GroupLayerCollection, Layer } from "../../api";
import { GroupLayer, GroupLayerConfig } from "../../api/layers/GroupLayer";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { GroupLayerCollectionImpl } from "../GroupLayerCollectionImpl";

export class GroupLayerImpl extends AbstractLayer implements GroupLayer {
    #olGroupLayer: Group;
    #children: GroupLayerCollection;

    constructor(config: GroupLayerConfig){
        const groupLayers = config.layers;
        const olGroup = new Group({layers: groupLayers.map(sublayer => sublayer.olLayer)});
        super({...config, olLayer: olGroup});

        // Register child -> parent links
        for (const layer of groupLayers) {
            layer.__attachToGroup(this);
        }

        this.#children = new GroupLayerCollectionImpl(groupLayers);
        this.#olGroupLayer = olGroup;
    }

    get type() {
        return "group" as const;
    }

    get legend() {
        return undefined;
    }

    get layers():GroupLayerCollection {
        return this.#children;
    }

    get sublayers(): undefined {
        return undefined;
    }

}
