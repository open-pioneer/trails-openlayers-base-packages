// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchApi, SearchClearTrigger, SearchResult } from "../api";

export class SearchApiImpl implements SearchApi {
    #clearInput: (trigger: SearchClearTrigger) => void;
    #setInputValue: (newValue: string) => void;
    #searchAndSelect: (input: string) => Promise<SearchResult | undefined>;

    constructor(
        clearInput: (trigger: SearchClearTrigger) => void,
        setInputValue: (newValue: string) => void,
        searchAndSelect: (inputValue: string) => Promise<SearchResult | undefined>
    ) {
        this.#clearInput = clearInput;
        this.#setInputValue = setInputValue;
        this.#searchAndSelect = searchAndSelect;
    }

    resetInput() {
        this.#clearInput("api-reset");
    }

    setInputValue(inputValue: string) {
        this.#setInputValue(inputValue);
    }

    async searchAndSelect(inputValue: string) {
        return this.#searchAndSelect(inputValue);
    }
}
