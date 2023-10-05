// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { _getNextURL, _queryPages, type QueryFeatureOptions } from "./OgcFeatureSourceFactory";
import { FeatureLike } from "ol/Feature";

const LOG = createLogger("ogc-features:OffsetStrategy");

export interface OffsetRequestProps {
    /** The maximum number of concurrent requests. Defaults to `6`. */
    numberOfConcurrentReq: number;

    /** The (maximum) number of items to fetch at once. Defaults to `2500`. */
    pageSize: number;
};

// Chrome does only allow 6 concurrent requests (HTTP/1.x)
export const defaultOffsetRequestProps: OffsetRequestProps = {
    numberOfConcurrentReq: 6,
    pageSize: 2500
};

export const isOffsetStrategySupported = async (collectionsItemsUrl: string) => {
    const response = await fetch(collectionsItemsUrl + "&limit=1", {
        headers: {
            Accept: "application/geo+json"
        }
    });
    if (response.status !== 200) {
        LOG.error(`Offset-Request failed with status ${response.status}:`, response);
        return false;
    }
    const jsonResp = await response.json();
    const nextUrl = _getNextURL(jsonResp.links);

    /* TODO:
    const parsedURL = new URL(nextUrl!);
    const hasOffset = parsedURL.searchParams.has("offset");
    */

    // TODO: Transport numberMatched and compute number of required pages
    return !!(jsonResp.numberMatched && nextUrl !== undefined && nextUrl.includes("offset"));
};

export const _queryAllFeaturesWithOffset = async (
    options: Omit<QueryFeatureOptions, "nextRequestProps">
): Promise<FeatureLike[]> => {
    const { fullURL, featureFormat, signal, addFeatures, queryFeatures } = options;

    let nextUrl = undefined;
    let allFeatures: FeatureLike[] = [];

    const { numberOfConcurrentReq, pageSize } = options.offsetRequestProps ?? defaultOffsetRequestProps;
    let startOffset = 0;
    do {
        const allRequests = _createOffsetURLs(
            fullURL,
            numberOfConcurrentReq,
            startOffset,
            pageSize
        );
        const allFeatureResp = await _queryPages(
            allRequests,
            featureFormat,
            signal,
            addFeatures,
            queryFeatures
        );
        allFeatures = allFeatures.concat(allFeatureResp.features);
        nextUrl = allFeatureResp.nextURL;
        startOffset += numberOfConcurrentReq * pageSize;
    } while (nextUrl !== undefined);
    return allFeatures;
};

export function _createOffsetURLs(
    fullURL: string,
    numberOfRequests: number = 10,
    startOffset: number = 0,
    offsetDelta: number = 5000
): Array<string> {
    const allRequests = [];
    let currentOffset = startOffset;
    for (let i = 0; i < numberOfRequests; i++) {
        allRequests.push(`${fullURL}&offset=${currentOffset}&limit=${offsetDelta}`);
        currentOffset += offsetDelta;
    }
    return allRequests;
}
