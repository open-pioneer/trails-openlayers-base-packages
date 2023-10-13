// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { getNextURL, queryPages, type QueryFeatureOptions } from "./OgcFeatureSourceFactory";
import { FeatureLike } from "ol/Feature";

const LOG = createLogger("ogc-features:OffsetStrategy");

export interface OffsetRequestProps {
    /** The maximum number of concurrent requests. Defaults to `6`. */
    maxNumberOfConcurrentReq: number;

    /** The (maximum) number of items to fetch at once. Defaults to `2500`. */
    pageSize: number;
}

// Chrome does only allow 6 concurrent requests (HTTP/1.x)
/** @internal */
export const defaultOffsetRequestProps: OffsetRequestProps = {
    maxNumberOfConcurrentReq: 6,
    pageSize: 2500
};

/** @internal */
export interface CollectionInfos {
    numberMatched: number;
    offsetStrategySupported: boolean;
    requiredPages: number;
}

/** @internal */
export async function getCollectionInfos(
    collectionsItemsUrl: string,
    offsetProps: OffsetRequestProps = defaultOffsetRequestProps
): Promise<CollectionInfos | undefined> {
    const url = new URL(collectionsItemsUrl);
    url.searchParams.set("limit", "1");
    url.searchParams.set("f", "json");
    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/geo+json"
        }
    });
    if (response.status !== 200) {
        LOG.error(`Offset-Request failed with status ${response.status}:`, response);
        return;
    }
    const jsonResp = await response.json();
    const nextUrl = getNextURL(jsonResp.links);

    if (!nextUrl) return;

    const parsedURL = new URL(nextUrl);
    const hasOffset = parsedURL.searchParams.has("offset");
    let requiredPages: number;
    if (jsonResp.numberMatched && offsetProps.pageSize) {
        requiredPages = Math.min(
            offsetProps.maxNumberOfConcurrentReq,
            Math.ceil(jsonResp.numberMatched / offsetProps.pageSize)
        );
    } else {
        requiredPages = offsetProps.maxNumberOfConcurrentReq;
    }

    return {
        numberMatched: jsonResp.numberMatched,
        offsetStrategySupported: hasOffset,
        requiredPages: requiredPages
    };
}

/** @internal */
export async function queryAllFeaturesWithOffset(
    options: Omit<QueryFeatureOptions, "nextRequestProps">
): Promise<FeatureLike[]> {
    const { fullURL, featureFormat, signal, addFeatures, queryFeatures } = options;

    let nextUrl = undefined;
    let allFeatures: FeatureLike[] = [];

    const offsetRequestProps = options.offsetRequestProps ?? defaultOffsetRequestProps;
    const requiredPages =
        options.collectionInfos?.requiredPages ?? offsetRequestProps.maxNumberOfConcurrentReq;

    const pageSizeToUse = Math.min(
        options.limit ?? offsetRequestProps.pageSize,
        offsetRequestProps.pageSize
    );

    let startOffset = 0;
    do {
        const allRequests = createOffsetURLs(fullURL, requiredPages, startOffset, pageSizeToUse);
        const allFeatureResp = await queryPages(
            allRequests,
            featureFormat,
            signal,
            addFeatures,
            queryFeatures
        );
        allFeatures = allFeatures.concat(allFeatureResp.features);
        nextUrl = allFeatureResp.nextURL;
        startOffset += requiredPages * pageSizeToUse;
    } while (nextUrl !== undefined);
    return allFeatures;
}

/** @internal */
export function createOffsetURLs(
    fullURL: string,
    numberOfRequests: number = 10,
    startOffset: number = 0,
    offsetDelta: number = 5000
): Array<string> {
    const allRequests = [];
    let currentOffset = startOffset;
    const url = new URL(fullURL);
    const searchParams = url.searchParams;
    for (let i = 0; i < numberOfRequests; i++) {
        searchParams.set("offset", currentOffset.toString());
        searchParams.set("limit", offsetDelta.toString());
        //const urlWithParams = fullURL.concat(`&${searchParams.toString()}`);
        allRequests.push(url.toString());
        currentOffset += offsetDelta;
    }
    return allRequests;
}
