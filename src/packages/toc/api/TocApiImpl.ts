// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { TocViewModel } from "../new-model/TocViewModel";
import { TocApi, TocItem } from "./types";

export class TocApiImpl implements TocApi {
    #tocViewModel: TocViewModel;

    constructor(model: TocViewModel) {
        this.#tocViewModel = model;
    }

    getItemById(id: string): TocItem | undefined {
        return this.#tocViewModel.getNodeById(id)?.tocItem;
    }

    getItemByLayerId(layerId: string): TocItem | undefined {
        return this.#tocViewModel.getNodeByLayerId(layerId)?.tocItem;
    }

    getItems(): TocItem[] {
        return this.#tocViewModel.getItems().map((node) => node.tocItem);
    }
}
