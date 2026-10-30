// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { SearchSource, SearchResult } from "./api";

const fakeStreetData = [
    {
        text: "Brückenweg 1"
    },
    {
        text: "Mauerstrasse 3"
    },
    {
        text: "Vogelgasse 4"
    },
    {
        text: "Kampweg 8"
    }
];
const fakeCityData = [
    {
        text: "Aachen"
    },
    {
        text: "Dortmund"
    },
    {
        text: "Langenfeld"
    },
    {
        text: "Düsseldorf"
    },
    {
        text: "Münster"
    }
];

const fakeRiverData = [
    {
        text: "Rhein"
    },
    {
        text: "Weser"
    },
    {
        text: "Ems"
    },
    {
        text: "Maas"
    },
    {
        text: "Elbe"
    }
];

const getFakeData = async (
    inputValue: string,
    responseData: { text: string }[],
    timeout: number
) => {
    return new Promise<typeof responseData>((resolve) => {
        setTimeout(() => {
            const cp = responseData.filter((item) =>
                item.text.toLowerCase().includes(inputValue.toLocaleLowerCase())
            );
            resolve(cp);
        }, timeout);
    });
};

export class FakeStreetSource implements SearchSource {
    label: string = "Streets";
    timeout: number;
    constructor(timeout: number = 250) {
        this.timeout = timeout;
    }
    async search(inputValue: string): Promise<SearchResult[]> {
        const result = await getFakeData(inputValue, fakeStreetData, this.timeout);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            label: item.text
        }));
        return suggestions;
    }
}
export class FakeCitySource implements SearchSource {
    label: string = "Cities";
    timeout: number;
    constructor(timeout: number = 250) {
        this.timeout = timeout;
    }
    async search(inputValue: string): Promise<SearchResult[]> {
        const result = await getFakeData(inputValue, fakeCityData, this.timeout);

        const suggestions = result.map((item, idx) => ({
            id: idx,
            label: item.text
        }));

        return suggestions;
    }
}

export class FakeRiverSource implements SearchSource {
    label: string = "Rivers";
    timeout: number;
    constructor(timeout: number = 250) {
        this.timeout = timeout;
    }
    async search(inputValue: string): Promise<SearchResult[]> {
        const result = await getFakeData(inputValue, fakeRiverData, this.timeout);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            label: item.text
        }));
        return suggestions;
    }
}
