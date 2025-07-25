// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchApi } from "./api";

export class SearchApiImpl implements SearchApi {
    #onInputChanged: (newValue: string) => void;
    constructor(onInputChanged: (newValue: string) => void) {
        this.#onInputChanged = onInputChanged;
    }

    resetInput() {
        this.#onInputChanged("");
    }
}
