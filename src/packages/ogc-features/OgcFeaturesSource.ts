// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { isAbortError } from "@open-pioneer/core";
import { SearchSource, SearchResult } from "@open-pioneer/search";
import { v4 as uuid4v } from "uuid";

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
    renderLabelFunction?: unknown;

    /**
     * Process function to modify the original URL
     */
    processUrlFunction?: unknown;
}

export class OgcFeaturesSearchSource implements SearchSource {
    label: string;
    options: OgcFeatureSearchSourceOptions;

    constructor(label: string, options: OgcFeatureSearchSourceOptions) {
        this.label = label;
        this.options = options;
    }

    async search(inputValue: string, options: { signal: AbortSignal }): Promise<SearchResult[]> {
        const signal = options?.signal;
        const url = this.#getUrl(inputValue);

        try {
            const responses = await request(url, signal);
            return responses.features.map((response) => ({
                ...response,
                id: uuid4v(),
                label: response.properties[
                    this.options.labelProperty
                        ? (this.options.labelProperty as keyof typeof response.properties)
                        : (this.options.searchProperty as keyof typeof response.properties)
                ]
            })) satisfies SearchResult[];
        } catch (error) {
            if (isAbortError(error)) {
                throw error;
            }

            throw new Error("Custom search failed", { cause: error });
        }
    }

    #getUrl(inputValue: string): string {
        return encodeURI(
            `${this.options.baseUrl}/collections/${this.options.collectionId}/items?${this.options.searchProperty}=*${inputValue}*&f=json`
        );
    }
}

interface OgcFeaturesSearchResponse {
    features: [
        {
            properties: {};
        }
    ];
    links?: object[];
    numberMatched?: number;
    numberReturned?: number;
    timestamp?: string;
    type?: string;
}

const request = async (
    url: string,
    signal?: AbortSignal | undefined
): Promise<OgcFeaturesSearchResponse> => {
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
