// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { DataSource } from "./api";

export class SearchController {
    #sources: DataSource[] = [];

    constructor(props: { sources: DataSource[] }) {
        this.#sources = props.sources;
    }

    async search(searchTerm: string) {
        const runningQueries = await Promise.all(
            this.#sources.map((source) => source.search(searchTerm))
        );
        return runningQueries;
    }

    get sources() {
        return this.#sources;
    }
}
