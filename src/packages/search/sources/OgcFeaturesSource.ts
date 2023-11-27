// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { DataSource, Suggestion } from "./../api";

export interface OgcFeatureSourceOptions {
    /** The base-URL right to the "/collections"-part */
    baseUrl: string;

    /** The collection-ID */
    collectionId: string;

    /** Parameter used for filtering on OGC API Features */
    searchParameter: string;

    /** Parameter used for labelling, if searchParameter isn't exists on feature properties */
    resultsParameter?: string;
}

export class OgcFeaturesSource implements DataSource {
    label: string;
    options: OgcFeatureSourceOptions;

    constructor(label: string, options: OgcFeatureSourceOptions) {
        this.label = label;
        this.options = options;
    }

    async search(inputValue: string, options: { signal: AbortSignal }): Promise<Suggestion[]> {
        const signal = options?.signal;
        const url = this.#getUrl(inputValue);

        try {
            const responses = await request(url, signal);
            return responses.features.map((response, idx) => ({
                ...response,
                id: idx,
                label: response.properties[
                    this.options.resultsParameter
                        ? (this.options.resultsParameter as keyof typeof response.properties)
                        : (this.options.searchParameter as keyof typeof response.properties)
                ]
            })) satisfies Suggestion[];
        } catch (error) {
            return [];
        }
    }

    #getUrl(inputValue: string): string {
        return encodeURI(
            `${this.options.baseUrl}/collections/${this.options.collectionId}/items?${this.options.searchParameter}=*${inputValue}*&f=json`
        );
    }
}

interface OgcFeaturesResponse {
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
): Promise<OgcFeaturesResponse> => {
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
