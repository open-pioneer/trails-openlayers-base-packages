// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { _getNextURL, _queryAllFeatures, FeatureResponse } from "./OgcFeatureSourceFactory";
import FeatureFormat from "ol/format/Feature";
import { Feature } from "ol";
import { Geometry } from "ol/geom";
import { createLogger } from "@open-pioneer/core";

const logger = createLogger("ogc-feature-api-layer:OffsetStrategy");

export type OffsetRequestProps = {
    numberOfConcurrentReq: number; // 6
    offsetDelta: number; // 2500
    startOffset: number; //0
};

// Chrome does only allow 6 concurrent requests (HTTP/1.x)
export const defaultOffsetRequestProps: OffsetRequestProps = {
    numberOfConcurrentReq: 6,
    offsetDelta: 2500,
    startOffset: 0
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

export const isOffsetStrategySupported = async (collectionsItemsUrl: string) => {
    const response = await fetch(collectionsItemsUrl + "&limit=1", {
        headers: {
            Accept: "application/geo+json"
        }
    });
    if (response.status !== 200) {
        logger.error(`Offset-Request failed with status ${response.status}:`, response);
        return false;
    }
    const jsonResp = await response.json();
    const nextUrl = _getNextURL(jsonResp.links);
    return jsonResp.numberMatched && nextUrl !== undefined && nextUrl.includes("offset");
};

export const _queryAllFeaturesWithOffset = async (
    fullURL: string,
    featureFormat: FeatureFormat,
    queryFeatures: (
        fullURL: string,
        featureFormat: FeatureFormat | undefined,
        signal: AbortSignal
    ) => Promise<FeatureResponse>,
    signal: AbortSignal,
    addFeatures: (features: Array<Feature<Geometry>>) => void,
    offsetProps: OffsetRequestProps = defaultOffsetRequestProps
): Promise<Array<Feature>> => {
    let nextUrl = undefined;
    let allFeatures: Array<Feature> = [];

    // eslint-disable-next-line prefer-const
    let { numberOfConcurrentReq, startOffset, offsetDelta } = offsetProps;
    do {
        const allRequests = _createOffsetURLs(
            fullURL,
            numberOfConcurrentReq,
            startOffset,
            offsetDelta
        );
        const allFeatureResp = await _queryAllFeatures(
            allRequests,
            featureFormat,
            signal,
            addFeatures,
            queryFeatures
        );
        allFeatures = allFeatures.concat(allFeatureResp.features);
        nextUrl = allFeatureResp.nextURL;
        startOffset += numberOfConcurrentReq * offsetDelta;
    } while (nextUrl !== undefined);
    return allFeatures;
};
