// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { FeatureLike } from "ol/Feature";
import { LoadFeatureOptions, loadPages } from "./createVectorSource";
import { createOffsetURL, getNextURL } from "./requestUtils";
import { HttpService } from "@open-pioneer/http";

/** @internal */
export interface CollectionInfos {
    /** True if features can be requested in pages using offset & limit parameters. */
    supportsOffsetStrategy: boolean;
}

export async function getCollectionInfos(
    collectionsItemsUrl: string,
    httpService: HttpService
): Promise<CollectionInfos> {
    const infos: CollectionInfos = {
        supportsOffsetStrategy: false
    };

    const url = new URL(collectionsItemsUrl);
    url.searchParams.set("limit", "1");
    url.searchParams.set("f", "json");
    const response = await httpService.fetch(url.toString(), {
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
    infos.supportsOffsetStrategy = hasOffset;
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
    const allFeatures: FeatureLike[] = [];
    let totalFeatures: number | undefined;
    while (currentUrl) {
        let pagesInIteration: number;
        if (totalFeatures == undefined) {
            // We don't know the actual size of the result set yet.
            pagesInIteration = maxConcurrency;
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
            options.httpService,
            signal,
            addFeatures,
            queryFeatures
        );

        allFeatures.push(...allFeatureResp.features);
        currentUrl = allFeatureResp.nextURL;
        if (allFeatureResp.numberMatched != null) {
            totalFeatures = allFeatureResp.numberMatched;
        }
    }
    while (currentUrl !== undefined);
    return allFeatures;
}
