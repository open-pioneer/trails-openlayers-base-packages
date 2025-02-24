// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { SearchSource, SearchResult } from "@open-pioneer/search";
import { SearchOptions } from "@open-pioneer/search/api";
import GeoJSON from "ol/format/GeoJSON";

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

/**
 * A simple search source that queries the [Photon Geocoder service](https://photon.komoot.io/).
 *
 * This source is intended to serve as an example.
 */
export class PhotonGeocoder implements SearchSource {
    label: string;
    filteredTypes: string[];
    httpService: HttpService;

    constructor(label: string, filteredTypes: string[], httpService: HttpService) {
        this.label = label;
        this.filteredTypes = filteredTypes;
        this.httpService = httpService;
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

    private async request(
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
        const response = await this.httpService.fetch(url, { signal });
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        const result = (await response.json()) as PhotonResponse;
        return result;
    }

    private createLabel(feature: PhotonResponseFeature) {
        return `${feature.properties.name} (${
            feature.properties.osm_value ? feature.properties.osm_value + ", " : ""
        }${feature.properties.postcode ? feature.properties.postcode + ", " : ""}${
            feature.properties.city ? feature.properties.city + ", " : ""
        }${feature.properties.country ? feature.properties.country + ")" : ")"}`;
    }
}
