// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Error } from "@open-pioneer/core";
import { DataSource, Suggestion } from "./api";

interface ControllerConfig {
    sources: DataSource[];
}
export class SearchController {
    #sources: DataSource[] = [];
    #abortController: AbortController | null = null;

    constructor(options: ControllerConfig) {
        this.#sources = options.sources;
    }

    async search(searchTerm: string): Promise<Suggestion[][]> {
        if (this.#abortController) this.#abortController.abort("AbortError");
        this.#abortController = new AbortController();
        const runningQueries = await Promise.all(
            this.#sources.map((source) => {
                return source.search(searchTerm, { signal: this.#abortController!.signal });
            })
        );
        return runningQueries;
    }

    get sources() {
        return this.#sources;
    }
}
