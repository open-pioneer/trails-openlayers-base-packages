// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { isAbortError } from "@open-pioneer/core";
import { SearchSource, SearchResult } from "@open-pioneer/search";
import { SearchOptions } from "@open-pioneer/search/api";
import { v4 as uuid4v } from "uuid";
import GeoJSON from "ol/format/GeoJSON";

export interface OgcFeatureSearchSourceOptions {
    /**
     * The base-URL right to the "/collections"-part
     */
    baseUrl: string;

    /**
     * The collection-ID
     */
    collectionId: string;

    /**
     * Property used for filtering on OGC API Features
     */
    searchProperty: string;

    /**
     * Property used for labelling, if searchProperty isn't exists on feature properties
     */
    labelProperty?: string;

    /**
     * Render function to create custom a label. If `renderLabelFunction` is configured,
     * `searchProperty` and `labelProperty` will be used as a fallback
     */
    renderLabelFunction?: (feature: FeatureResponse) => string;

    /**
     * Rewrite function to modify the original URL
     */
    rewriteUrlFunction?: (url: URL) => URL;
}

export class OgcFeatureSearchSource implements SearchSource {
    label: string;
    options: OgcFeatureSearchSourceOptions;

    constructor(label: string, options: OgcFeatureSearchSourceOptions) {
        this.label = label;
        this.options = options;
    }

    async search(
        inputValue: string,
        { mapProjection, signal }: SearchOptions
    ): Promise<SearchResult[]> {
        const url = this.#getUrl(inputValue);

        try {
            const responses = await request(this.options.rewriteUrlFunction?.(url) || url, signal);
            const geojson = new GeoJSON({
                dataProjection: "EPSG:4326",
                featureProjection: mapProjection
            });

            return responses.features.map((feature) => {
                const customLabel = this.options.renderLabelFunction?.(feature);

                const singleLabelProperty =
                    feature.properties[
                        this.options.labelProperty as keyof typeof feature.properties
                    ];

                const singleSearchProperty =
                    feature.properties[
                        this.options.searchProperty as keyof typeof feature.properties
                    ];

                const label = (() => {
                    if (singleLabelProperty !== undefined) {
                        return String(singleLabelProperty);
                    } else if (singleSearchProperty !== undefined) {
                        return String(singleSearchProperty);
                    } else {
                        return "";
                    }
                })();

                return {
                    ...feature,
                    id: uuid4v(),
                    label: customLabel || label,
                    geometry: geojson.readGeometry(feature.geometry),
                    properties: feature.properties
                };
            }) satisfies SearchResult[];
        } catch (error) {
            if (isAbortError(error)) {
                throw error;
            }

            throw new Error("Custom search failed", { cause: error });
        }
    }

    #getUrl(inputValue: string): URL {
        const url = new URL(
            `${this.options.baseUrl}/collections/${this.options.collectionId}/items?`
        );

        url.searchParams.set(this.options.searchProperty, `*${inputValue}*`);
        url.searchParams.set("f", "json");

        return url;
    }
}

interface FeatureResponse {
    type: string;
    id: string | number;
    geometry: unknown;
    properties: Readonly<Record<string, unknown>>;
}

export interface SearchResponse {
    features: FeatureResponse[];
    links?: Record<string, unknown>[];
    numberMatched?: number;
    numberReturned?: number;
    timeStamp?: string;
    type?: string;
}

const request = async (url: URL, signal?: AbortSignal | undefined): Promise<SearchResponse> => {
    try {
        const response = await fetch(url, { signal });
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        const result = await response.json();

        return result;
    } catch (error) {
        throw new Error("Request failed: " + error);
    }
};
