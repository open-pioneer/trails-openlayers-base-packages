// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchSource, SearchResult } from "@open-pioneer/search";

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
        const results = result.map((item, idx) => ({
            id: idx,
            label: item.text
        }));
        return results;
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

        const results = result.map((item, idx) => ({
            id: idx,
            label: item.text
        }));

        return results;
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
        const results = result.map((item, idx) => ({
            id: idx,
            label: item.text
        }));
        return results;
    }
}

type ValidSearchParams = "city" | "street";

// https://github.com/osm-search/Nominatim and https://nominatim.openstreetmap.org/
export class NominatimGeocoder implements SearchSource {
    label: string;
    searchParameterName: ValidSearchParams;

    constructor(searchParameterName: ValidSearchParams, label: string) {
        this.searchParameterName = searchParameterName;
        this.label = label;
    }

    async search(inputValue: string, options: { signal: AbortSignal }): Promise<SearchResult[]> {
        const signal = options?.signal;
        const url = this.#getUrl(inputValue);

        const responses = await request(url, signal);
        return responses.map(
            (response, idx): SearchResult => ({
                id: idx,
                label: response.display_name,
                properties: {
                    ...response
                }
            })
        );
    }

    #getUrl(inputValue: string): string {
        return encodeURI(
            `https://nominatim.openstreetmap.org/search?${this.searchParameterName}=${inputValue}&country=Germany&polygon_geojson=1&format=jsonv2`
        );
    }
}

interface NominatimResponse {
    display_name: string;
    geojson: {
        type: string;
        coordinates: [[number, number]];
    };
    boundingbox: string[];
    lat: number;
    lon: number;
    importance: number;
}

const request = async (
    url: string,
    signal?: AbortSignal | undefined
): Promise<NominatimResponse[] | []> => {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }
    const result = await response.json();
    return result;
};
