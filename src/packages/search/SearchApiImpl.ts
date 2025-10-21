// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchApi, SearchClearTrigger } from "./api";

export class SearchApiImpl implements SearchApi {
    #clearInput: (trigger: SearchClearTrigger) => void;
    #setInputValue: (newValue: string) => void;

    constructor(
        clearInput: (trigger: SearchClearTrigger) => void,
        setInputValue: (newValue: string) => void
    ) {
        this.#clearInput = clearInput;
        this.#setInputValue = setInputValue;
    }

    resetInput() {
        this.#clearInput("api-reset");
    }

    // todo write test
    setInputValue(inputValue: string) {
        this.#setInputValue(inputValue);
    }
}
