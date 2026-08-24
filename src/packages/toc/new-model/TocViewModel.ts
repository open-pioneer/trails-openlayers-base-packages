// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { reactiveMap, ReactiveMap } from "@conterra/reactivity-core";
import { destroyResource, Resource } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { createNodeChildren, syncChildren } from "./syncChildren";
import { TocLayerNode } from "./TocLayerNode";

export class TocViewModel {
    #map: MapModel;
    #shared: SharedData;
    #children = createNodeChildren();

    #layersWatch: Resource | undefined;

    constructor(map: MapModel) {
        this.#map = map;
        this.#shared = {
            nodesById: reactiveMap()
        };
        this.#layersWatch = syncChildren({
            parent: undefined,
            shared: this.#shared,
            getLayers: () =>
                this.#map.layers.getOperationalLayers({
                    sortByDisplayOrder: true,
                    includeInternalLayers: true
                }),
            children: this.#children
        });
    }

    destroy() {
        this.#layersWatch = destroyResource(this.#layersWatch);
    }

    /**
     * Returns the toc node associated with the given id.
     */
    getNodeById(id: string): TocLayerNode | undefined {
        return this.#shared.nodesById.get(id);
    }

    /**
     * Returns the top level toc nodes in this view model, in display order.
     *
     * Nested children can be reached by walking the object graph.
     */
    get children(): TocLayerNode[] {
        return this.#children.order.value;
    }
}

/**
 * Data shared by the view model and all it sub objects.
 */
export interface SharedData {
    /**
     * Id -> Node mapping for all nodes in the model.
     * These are updated by the synchronization code whenever node are created or destroyed.
     */
    nodesById: ReactiveMap<string, TocLayerNode>;
}
