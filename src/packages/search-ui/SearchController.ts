// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { DataSource, Suggestion } from "./api";

interface ControllerConfig {
    sources: DataSource[];
}
export class SearchController {
    #sources: DataSource[] = [];

    constructor(options: ControllerConfig) {
        this.#sources = options.sources;
    }

    async search(searchTerm: string): Promise<Suggestion[][]> {
        const runningQueries = await Promise.all(
            this.#sources.map((source) => source.search(searchTerm))
        );
        return runningQueries;
    }

    get sources() {
        return this.#sources;
    }
}
