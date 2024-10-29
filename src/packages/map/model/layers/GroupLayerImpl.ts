// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Group } from "ol/layer";
import { Layer } from "../../api";
import { GroupLayer, GroupLayerConfig } from "../../api/layers/GroupLayer";
import { AbstractLayer } from "../AbstractLayer";
import { AbstractLayerBase } from "../AbstractLayerBase";

export class GroupLayerImpl extends AbstractLayer implements GroupLayer {
    #olGroupLayer: Group;
    #children: Layer[];

    constructor(config: GroupLayerConfig){
        // TODO: register sublayer.parentLayer
        const olGroup = new Group({layers: config.sublayers.map(sublayer => sublayer.olLayer)});
        super({...config, olLayer: olGroup});

        // Register child -> parent links
        for (const sublayer of config.sublayers) {
            // TODO: instanceof/typecheck first?
            (sublayer as unknown as AbstractLayerBase).__attachToGroup(this);
        }

        this.#children = config.sublayers;
        this.#olGroupLayer = olGroup;
    }

    get type() {
        return "group" as const;
    }

    get legend() {
        return undefined;
    }

    get layers(): Layer[] {
        return this.#children;
    }

    get sublayers(): undefined {
        return undefined;
    }
}