// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { isAbortError } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { SearchOptions, SearchResult, SearchSource } from "@open-pioneer/search";
import GeoJSON from "ol/format/GeoJSON";
import { v4 as uuid4v } from "uuid";
import { OgcFeatureSearchSourceOptions } from "../api";

/** The general shape of features returned by an OGC API Features service. */
export interface FeatureResponse {
    /**
     * The type of the feature (e.g. `Feature`).
     */
    type: string;

    /**
     * The id of the feature.
     */
    id: string | number;

    /**
     * The geometry of the feature.
     */
    geometry: unknown;

    /**
     * The properties of the feature.
     */
    properties: Readonly<Record<string, unknown>>;
}

/**
 * An implementation of {@link SearchSource} that searches on an OGC Features API service.
 */
export class OgcFeatureSearchSource implements SearchSource {
    readonly label: string;
    #options: OgcFeatureSearchSourceOptions;
    #httpService: HttpService;
    #baseUrl: string;
    #params: URLSearchParams;

    constructor(options: OgcFeatureSearchSourceOptions, httpService: HttpService) {
        this.label = options.label;
        this.#options = options;
        this.#httpService = httpService;

        const { baseUrl, params } = getBaseUrl(options.baseUrl);
        this.#baseUrl = baseUrl;
        this.#params = params;
    }

    async search(
        inputValue: string,
        { mapProjection, maxResults, signal }: SearchOptions
    ): Promise<SearchResult[]> {
        const url = this.#getUrl(inputValue, maxResults);
        const geojson = new GeoJSON({
            dataProjection: "EPSG:4326",
            featureProjection: mapProjection
        });

        const responses = await fetchJson(this.#httpService, url, signal);
        return responses.features.map((feature) => this.#createResult(feature, geojson));
    }

    #createResult(feature: FeatureResponse, geojson: GeoJSON): SearchResult {
        const customLabel = this.#options.renderLabel?.(feature);

        const singleLabelProperty =
            feature.properties[this.#options.labelProperty as keyof typeof feature.properties];

        const singleSearchProperty =
            feature.properties[this.#options.searchProperty as keyof typeof feature.properties];

        const label = (() => {
            if (customLabel) {
                return customLabel;
            } else if (singleLabelProperty !== undefined) {
                return String(singleLabelProperty);
            } else if (singleSearchProperty !== undefined) {
                return String(singleSearchProperty);
            } else {
                return "";
            }
        })();

        return {
            id: feature.id ?? uuid4v(),
            label: label,
            geometry: geojson.readGeometry(feature.geometry),
            properties: feature.properties
        };
    }

    #getUrl(inputValue: string, limit: number): URL {
        const url = new URL(`${this.#baseUrl}/collections/${this.#options.collectionId}/items`);

        for (const [k, v] of this.#params) {
            url.searchParams.append(k, v);
        }
        url.searchParams.set(this.#options.searchProperty, `*${inputValue}*`);
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("f", "json");

        // Passing a copy of the original URL to prevent accidental modifications.
        // Users should return a new URL instead.
        return this.#options.rewriteUrl?.(new URL(url)) ?? url;
    }
}

// Exported for test
export interface SearchResponse {
    features: FeatureResponse[];
    links?: Record<string, unknown>[];
    numberMatched?: number;
    numberReturned?: number;
    timeStamp?: string;
    type?: string;
}

async function fetchJson(
    httpService: HttpService,
    url: URL,
    signal?: AbortSignal | undefined
): Promise<SearchResponse> {
    try {
        const response = await httpService.fetch(url, {
            signal,
            headers: {
                Accept: "application/json"
            }
        });
        if (!response.ok) {
            throw new Error("Request failed with status " + response.status);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        if (isAbortError(error)) {
            throw error;
        }
        throw new Error("Failed to search on OGC API Features service", { cause: error });
    }
}

/**
 * Splits the base url into a "clean" base URL (no query params) and the original query params.
 */
function getBaseUrl(baseUrl: string) {
    const url = new URL(baseUrl);
    const params = new URLSearchParams(url.searchParams);
    url.search = "";

    const cleanBaseUrl = url.href.replace(/\/+$/, ""); // prevent double slash
    return { baseUrl: cleanBaseUrl, params };
}
