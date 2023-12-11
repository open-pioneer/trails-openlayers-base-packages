// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { SearchSource, SearchResult } from "@open-pioneer/search";
import { SearchOptions } from "@open-pioneer/search/api";
import GeoJSON from "ol/format/GeoJSON";

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

        const responses = (await request(url, signal)) as NominatimResponse[];
        return responses.map(
            (response, idx): SearchResult => ({
                // TODO, generate good IDs from server. alternative uuid v4
                id: idx,
                label: response.display_name,
                properties: {
                    ...response
                }
            })
        );
    }

    #getUrl(inputValue: string): string {
        // TODO: URL Klasse benutzen mit searchParameters, alternativ mit encodeURIComponent
        return encodeURI(
            `https://nominatim.openstreetmap.org/search?${this.searchParameterName}=${inputValue}&country=Germany&polygon_geojson=1&format=jsonv2`
        );
    }
}

interface PhotonResponseFeature {
    geometry: unknown; // geojson
    properties: {
        osm_id: number;
        osm_value: string;
        name: string;
        city: string;
        postcode: string;
        country: string;
        type: string;
    };
}

interface PhotonResponse {
    features: PhotonResponseFeature[];
}

export class PhotonGeocoder implements SearchSource {
    label: string;
    filteredTypes: string[];

    constructor(label: string, filteredTypes: string[]) {
        this.label = label;
        this.filteredTypes = filteredTypes;
    }

    async request(
        inputValue: string,
        limit: number,
        signal?: AbortSignal | undefined
    ): Promise<PhotonResponse> {
        const url = new URL("https://photon.komoot.io/api?");
        url.searchParams.set("q", inputValue);
        url.searchParams.set("lang", "de");
        url.searchParams.set("lat", "51.961563");
        url.searchParams.set("lon", "7.628202");
        url.searchParams.set("limit", limit.toString());
        const response = await fetch(url, { signal });
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        const result = (await response.json()) as PhotonResponse;
        return result;
    }

    createLabel(feature: PhotonResponseFeature) {
        return `${feature.properties.name} (${
            feature.properties.osm_value ? feature.properties.osm_value + ", " : ""
        }${feature.properties.postcode ? feature.properties.postcode + ", " : ""}${
            feature.properties.city ? feature.properties.city + ", " : ""
        }${feature.properties.country ? feature.properties.country + ")" : ")"}`;
    }

    async search(
        inputValue: string,
        { mapProjection, signal }: SearchOptions
    ): Promise<SearchResult[]> {
        const response = await this.request(inputValue, 100, signal);
        const geojson = new GeoJSON({
            dataProjection: "EPSG:4326",
            featureProjection: mapProjection
        });

        return response.features
            .filter((feature: PhotonResponseFeature) =>
                this.filteredTypes.includes(feature.properties.type)
            )
            .map((feature: PhotonResponseFeature, idx: number): SearchResult => {
                const geometry = geojson.readGeometry(feature.geometry);
                return {
                    id: feature.properties.osm_id || idx,
                    label: this.createLabel(feature),
                    geometry: geometry,
                    properties: feature.properties
                };
            });
    }
}

async function request(url: string, signal?: AbortSignal | undefined): Promise<unknown[] | []> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }
    const result = await response.json();
    return result;
}
