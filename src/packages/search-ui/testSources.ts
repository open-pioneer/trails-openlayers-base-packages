// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DataSource, Suggestion } from "./api";

interface Feature {
    bbox: number[];
    geometry?: { coordinates: [number, number]; type: string };
    properties: Readonly<Record<string, unknown>>;
    type: string;
    id: string;
}
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

const request = async (url: string, signal?: AbortSignal | undefined): Promise<Feature[] | []> => {
    try {
        const response = await fetch(url, { signal });
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        const result = await response.json();

        return result.features;
    } catch (error) {
        // return [];
        throw new Error("Request failed: " + error);
    }
};
export class GeoSearchSource implements DataSource {
    label: string = "Bkg-Service";
    async search(
        inputValue: string,
        options?: { signal?: AbortSignal | undefined } | undefined
    ): Promise<Suggestion[]> {
        const signal = options?.signal;
        const url = this.#getUrl(inputValue);

        try {
            const features = await request(url, signal);
            return features.map((feature, idx) => ({
                id: idx,
                text: feature.properties?.text
            })) as Suggestion[];
        } catch (error) {
            return [];
        }
    }
    #getUrl(inputValue: string): string {
        return `URL ${inputValue}`;
    }
}

export class FakeStreetSource implements DataSource {
    label: string = "Streets";
    timeout: number;
    constructor(timeout: number = 250) {
        this.timeout = timeout;
    }
    async search(inputValue: string): Promise<Suggestion[]> {
        const result = await getFakeData(inputValue, fakeStreetData, this.timeout);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            text: item.text
        }));
        return suggestions;
    }
}
export class FakeCitySource implements DataSource {
    label: string = "Cities";
    timeout: number;
    constructor(timeout: number = 250) {
        this.timeout = timeout;
    }
    async search(inputValue: string): Promise<Suggestion[]> {
        const result = await getFakeData(inputValue, fakeCityData, this.timeout);

        const suggestions = result.map((item, idx) => ({
            id: idx,
            text: item.text
        }));

        return suggestions;
    }
}

export class FakeRiverSource implements DataSource {
    label: string = "Rivers";
    timeout: number;
    constructor(timeout: number = 250) {
        this.timeout = timeout;
    }
    async search(inputValue: string): Promise<Suggestion[]> {
        const result = await getFakeData(inputValue, fakeRiverData, this.timeout);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            text: item.text
        }));
        return suggestions;
    }
}
export class FakeRejectionSource implements DataSource {
    label: string = "Rejected";
    async search(inputValue: string): Promise<Suggestion[]> {
        return Promise.reject(new Error(`search with ${inputValue} rejected`));
    }
}
