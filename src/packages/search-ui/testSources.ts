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
    duration = 1000
) => {
    return new Promise<typeof responseData>((resolve) => {
        setTimeout(() => {
            const cp = responseData.filter((item) =>
                item.text.toLowerCase().includes(inputValue.toLocaleLowerCase())
            );
            resolve(cp);
        }, duration);
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
        console.error(error);
        return [];
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
                text: feature.properties?.text,
                properties: feature.properties
            })) as Suggestion[];
        } catch (error) {
            console.error(error);
            return [];
        }
    }
    #getUrl(inputValue: string): string {
        return `URL`;
    }
}

export class FakeStreetSource implements DataSource {
    label: string = "Streets";
    async search(inputValue: string): Promise<Suggestion[]> {
        const result = await getFakeData(inputValue, fakeStreetData);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            text: item.text
        }));
        return suggestions;
    }
}
export class FakeCitySource implements DataSource {
    label: string = "Cities";
    async search(inputValue: string): Promise<Suggestion[]> {
        const result = await getFakeData(inputValue, fakeCityData);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            text: item.text
        }));
        return suggestions;
    }
}

export class FakeRiverSource implements DataSource {
    label: string = "Rivers";
    async search(inputValue: string): Promise<Suggestion[]> {
        const result = await getFakeData(inputValue, fakeRiverData);
        const suggestions = result.map((item, idx) => ({
            id: idx,
            text: item.text
        }));
        return suggestions;
    }
}
