// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { SearchApi, SelectResult } from "../api";
import { SearchViewModel } from "../model";

/**
 * Implements the public search API by delegating to the view model.
 */
export class SearchApiImpl implements SearchApi {
    #viewModel: SearchViewModel;

    constructor(viewModel: SearchViewModel) {
        this.#viewModel = viewModel;
    }

    resetInput(): void {
        this.#viewModel.clear("api-reset");
    }

    setInputValue(inputValue: string): void {
        this.#viewModel.setInputValue(inputValue);
    }

    searchAndSelect(inputValue: string): Promise<SelectResult | undefined> {
        return this.#viewModel.searchAndSelect(inputValue);
    }
}
