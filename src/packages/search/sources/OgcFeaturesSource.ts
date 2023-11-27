// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { DataSource, Suggestion } from "./../api";

export interface OgcFeatureSourceOptions {
    /** The base-URL right to the "/collections"-part */
    baseUrl: string;

    /** The collection-ID */
    collectionId: string;
}

export class OgcFeaturesSource implements DataSource {
    label: string;
    searchParameterName: string;
    options: OgcFeatureSourceOptions;

    constructor(searchParameterName: string, label: string, options: OgcFeatureSourceOptions) {
        this.label = label;
        this.searchParameterName = searchParameterName;
        this.options = options;
    }

    async search(inputValue: string, options: { signal: AbortSignal }): Promise<Suggestion[]> {
        const signal = options?.signal;
        const url = this.#getUrl(inputValue);

        try {
            const responses = await request(url, signal);
            console.log(responses);
            return [];
            // return responses.map((response, idx) => ({
            //     ...response,
            //     id: idx,
            //     label: "TEST"
            // })) satisfies Suggestion[];
        } catch (error) {
            return [];
        }
    }

    #getUrl(inputValue: string): string {
        return encodeURI(
            `${this.options.baseUrl}/collections/${this.options.collectionId}/items?${this.searchParameterName}=*${inputValue}*&f=json`
        );
    }
}

interface OgcFeaturesResponse {
    features: object[];
    links: object[];
    numberMatched: number;
    numberReturned: number;
    timestamp: string;
    type: string;
}

const request = async (
    url: string,
    signal?: AbortSignal | undefined
): Promise<OgcFeaturesResponse[] | []> => {
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
