// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { TocLayerNode } from "../model/TocLayerNode";
import { TocViewModel } from "../model/TocViewModel";
import { TocItem } from "./TocItem";

/**
 * API to control the Toc component imperatively
 */
export class TocApi {
    #tocViewModel: TocViewModel;

    constructor(model: TocViewModel) {
        this.#tocViewModel = model;
    }

    /**
     * Returns the toc item for the given `id`.
     */
    getItemById(id: string): TocItem | undefined {
        return this.#toItem(this.#tocViewModel.getNodeById(id));
    }

    /**
     * Returns the item that corresponds with the `layerId`.
     */
    getItemByLayerId(layerId: string): TocItem | undefined {
        return this.#toItem(this.#tocViewModel.getNodeByLayerId(layerId));
    }

    /**
     * Returns the list of all registered items in the Toc.
     */
    getItems(): TocItem[] {
        return this.#tocViewModel
            .getItems()
            .map((node) => this.#toItem(node))
            .filter((item) => item != null);
    }

    // Internal layers and layers hidden via `listMode` are not part of the
    // public API, even though they still have an associated node internally.
    #toItem(node: TocLayerNode | undefined): TocItem | undefined {
        if (!node || !node.isShown) {
            return undefined;
        }
        return node.tocItem;
    }
}
