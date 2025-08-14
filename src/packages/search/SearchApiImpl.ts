// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchApi, SearchClearEvent } from "./api";

export class SearchApiImpl implements SearchApi {
    #onInputChanged: (newValue: string) => void;
    #onClear: ((event: SearchClearEvent) => void) | undefined;
    constructor(
        onInputChanged: (newValue: string) => void,
        onClear: ((event: SearchClearEvent) => void) | undefined
    ) {
        this.#onInputChanged = onInputChanged;
        this.#onClear = onClear;
    }

    resetInput() {
        this.#onInputChanged("");
        this.#onClear?.({ trigger: "api-reset" });
    }
}
