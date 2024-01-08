// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ResultData } from "./api";

/**
 * Interface for Developer to change data in Result-UI
 */
export class ImportController {
    #onSetData: (data: ResultData | null) => Promise<unknown>;

    constructor(onSetData: (data: ResultData | null) => Promise<unknown>) {
        this.#onSetData = onSetData;
    }

    setDataSource(data: ResultData | null) {
        return this.#onSetData(data);
    }
}
