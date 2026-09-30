// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { TocLayerNode } from "../new-model/TocLayerNode";
import { TocViewModel } from "../new-model/TocViewModel";
import { TocApi, TocItem } from "./types";

export class TocApiImpl implements TocApi {
    #tocViewModel: TocViewModel;

    constructor(model: TocViewModel) {
        this.#tocViewModel = model;
    }

    getItemById(id: string): TocItem | undefined {
        return this.#toItem(this.#tocViewModel.getNodeById(id));
    }

    getItemByLayerId(layerId: string): TocItem | undefined {
        return this.#toItem(this.#tocViewModel.getNodeByLayerId(layerId));
    }

    getItems(): TocItem[] {
        return this.#tocViewModel
            .getItems()
            .map((node) => this.#toItem(node))
            .filter((item) => item !== undefined);
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
