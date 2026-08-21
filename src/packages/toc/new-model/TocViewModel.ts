// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactive } from "@conterra/reactivity-core";
import { destroyResource, Resource } from "@open-pioneer/core";
import { AnyLayer, MapModel } from "@open-pioneer/map";
import { syncChildren } from "./syncChildren";
import { TocLayerNode } from "./TocLayerNode";

export class TocViewModel {
    #map: MapModel;
    // #nodesById = reactiveMap<string, TocLayerNode>();

    #nodeIndex = new Map<AnyLayer, TocLayerNode>();
    #nodes = reactive<TocLayerNode[]>([]);

    #layersWatch: Resource | undefined;

    constructor(map: MapModel) {
        this.#map = map;
        this.#layersWatch = syncChildren(
            undefined,
            this.#nodeIndex,
            () =>
                this.#map.layers.getOperationalLayers({
                    sortByDisplayOrder: true,
                    includeInternalLayers: true
                }),
            this.#nodes
        );
    }

    destroy() {
        this.#layersWatch = destroyResource(this.#layersWatch);
    }

    get children(): TocLayerNode[] {
        return this.#nodes.value;
    }
}
