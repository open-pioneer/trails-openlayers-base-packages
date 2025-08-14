// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchApi, SearchClearTrigger } from "./api";

export class SearchApiImpl implements SearchApi {
    #clearInput: (trigger: SearchClearTrigger) => void;
    constructor(clearInput: (trigger: SearchClearTrigger) => void) {
        this.#clearInput = clearInput;
    }

    resetInput() {
        this.#clearInput("api-reset");
    }
}
