// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { FeatureLike } from "ol/Feature";
import { LoadFeatureOptions, loadPages } from "./OgcFeatureSourceFactory";
import { createOffsetURL, getNextURL } from "./requestUtils";

/** @internal */
export interface CollectionInfos {
    /** True if features can be requested in pages using offset & limit parameters. */
    supportsOffsetStrategy: boolean;
}

export async function getCollectionInfos(collectionsItemsUrl: string): Promise<CollectionInfos> {
    const infos: CollectionInfos = {
        supportsOffsetStrategy: false
    };

    const url = new URL(collectionsItemsUrl);
    url.searchParams.set("limit", "1");
    url.searchParams.set("f", "json");
    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/geo+json"
        }
    });
    if (response.status !== 200) {
        throw new Error(`Failed to probe collection information (status code ${response.status})`);
    }

    const jsonResp = await response.json();
    const nextUrl = getNextURL(jsonResp.links);
    if (!nextUrl) {
        return infos;
    }

    const parsedURL = new URL(nextUrl);
    const hasOffset = parsedURL.searchParams.has("offset");
    const hasNumberMatched = typeof jsonResp?.numberMatched === "number";
    infos.supportsOffsetStrategy = hasOffset && hasNumberMatched;
    return infos;
}

/** @internal */
export async function loadAllFeaturesWithOffset(
    options: LoadFeatureOptions
): Promise<FeatureLike[]> {
    const { fullURL, featureFormat, signal, addFeatures, queryFeatures } = options;
    const pageSize = options.limit;
    const maxConcurrency = options.maxConcurrentRequests;

    let startOffset = 0;
    let currentUrl: string | undefined = fullURL;
    let allFeatures: FeatureLike[] = [];
    let totalFeatures: number | undefined;
    while (currentUrl) {
        let pagesInIteration: number;
        if (totalFeatures == undefined) {
            // Initial assume 4 pages (or less) because we don't know the actual size of the result set yet.
            pagesInIteration = 4;
        } else {
            pagesInIteration = Math.ceil((totalFeatures - startOffset) / pageSize);
        }
        pagesInIteration = Math.max(1, Math.min(pagesInIteration, maxConcurrency));

        const urls: string[] = [];
        for (let page = 0; page < pagesInIteration; ++page) {
            urls.push(createOffsetURL(fullURL, startOffset, pageSize));
            startOffset += pageSize;
        }

        const allFeatureResp = await loadPages(
            urls,
            featureFormat,
            signal,
            addFeatures,
            queryFeatures
        );

        allFeatures = allFeatures.concat(allFeatureResp.features);
        currentUrl = allFeatureResp.nextURL;
        if (allFeatureResp.numberMatched != null) {
            totalFeatures = allFeatureResp.numberMatched;
        }
    }
    while (currentUrl !== undefined);
    return allFeatures;
}
