// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { TocModel } from "./TocModel";
import { TocApi, TocItem } from "./types";

export class TocApiImpl implements TocApi {
    #tocModel: TocModel;

    constructor(model: TocModel) {
        this.#tocModel = model;
    }

    getItemById(id: string): TocItem | undefined {
        return this.#tocModel.getItemById(id);
    }

    getItemByLayerId(layerId: string): TocItem | undefined {
        return this.#tocModel.getItemByLayerId(layerId);
    }

    getItems(): TocItem[] {
        return this.#tocModel.getItems();
    }
}
