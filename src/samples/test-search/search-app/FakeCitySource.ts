// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { SearchResult, SearchSource } from "@open-pioneer/search";

const CITIES = ["Aachen", "Dortmund", "Langenfeld", "Düsseldorf", "Münster"];

/**
 * A search source with a fixed list of city names, filtered by the input value after a delay.
 */
export class FakeCitySource implements SearchSource {
    label: string = "Cities";
    #timeout: number;

    constructor(timeout: number = 250) {
        this.#timeout = timeout;
    }

    async search(inputValue: string): Promise<SearchResult[]> {
        await new Promise((resolve) => setTimeout(resolve, this.#timeout));
        const needle = inputValue.toLocaleLowerCase();
        return CITIES.filter((city) => city.toLowerCase().includes(needle)).map((city, idx) => ({
            id: idx,
            label: city
        }));
    }
}
