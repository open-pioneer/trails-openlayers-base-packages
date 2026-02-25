// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import Feature from "ol/Feature";
import FeatureFormat from "ol/format/Feature";
import { sourceId } from "open-pioneer:source-info";
import { type NextStrategy } from "./NextStrategy";
import { FeatureResponse, getNextLink, queryFeatures } from "./requestUtils";

const LOG = createLogger(sourceId);

const DEFAULT_CONCURRENCY = 6;

export interface OffsetStrategyOptions {
    fullUrl: URL;
    limit: number;
    featureFormat: FeatureFormat;
    httpService: HttpService;
    signal: AbortSignal;
    concurrency?: number;

    // Called for partial results as they appear
    onFeaturesLoaded: (features: Feature[]) => void;
}

/**
 * Loads features from the OGC API Features collection by using the non-standard `offset` parameter
 *
 * This can be faster than the standards compliant {@link NextStrategy} because we can issue
 * parallel requests for large datasets.
 */
export class OffsetStrategy {
    private concurrency: number;

    constructor(private options: OffsetStrategyOptions) {
        this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
        if (this.concurrency < 1) {
            throw new Error("Invalid concurrency: " + this.concurrency);
        }
    }

    async load(): Promise<Feature[]> {
        const options = this.options;
        const fullUrl = options.fullUrl;
        const pageSize = options.limit;
        const concurrency = this.concurrency;

        let startOffset = 0;
        let currentUrl: URL | undefined = fullUrl;

        const featureChunks: Feature[][] = [];
        let totalFeatures: number | undefined;
        while (currentUrl) {
            let pagesInIteration: number;
            if (totalFeatures == undefined) {
                // We don't know the actual size of the result set yet.
                pagesInIteration = concurrency;
            } else {
                pagesInIteration = Math.ceil((totalFeatures - startOffset) / pageSize);
            }
            pagesInIteration = Math.max(1, Math.min(pagesInIteration, concurrency));

            const urls: URL[] = [];
            for (let page = 0; page < pagesInIteration; ++page) {
                urls.push(createOffsetUrl(fullUrl, startOffset, pageSize));
                startOffset += pageSize;
            }

            const { features, numberMatched, nextLink } = await this.#loadPages(urls);
            featureChunks.push(features);
            currentUrl = nextLink ? new URL(nextLink) : undefined;
            if (numberMatched != null) {
                totalFeatures = numberMatched;
            }
        }
        return featureChunks.flat(1);
    }

    /**
     * Loads features from multiple urls in parallel.
     * The URLs should represent pages of the same result set.
     * The `nextURL` of the last page (if any) is returned from this function.
     */
    async #loadPages(allUrls: URL[]): Promise<FeatureResponse> {
        const { featureFormat, httpService, signal, onFeaturesLoaded } = this.options;
        const allFeatureResponse: FeatureResponse = {
            nextLink: undefined,
            numberMatched: undefined,
            features: []
        };
        const allRequestPromises = allUrls.map(async (singleUrl, index): Promise<void> => {
            const isLast = index === allUrls.length - 1;

            const {
                features,
                numberMatched,
                nextLink: nextUrl
            } = await queryFeatures(singleUrl, featureFormat, httpService, signal);
            onFeaturesLoaded(features);

            LOG.debug(
                `NextURL for index = ${index} (isLast = ${isLast}): ${nextUrl || "No Next URL"}`
            );
            allFeatureResponse.features.push(...features);
            if (isLast) {
                allFeatureResponse.numberMatched = numberMatched;
                allFeatureResponse.nextLink = nextUrl;
            }
        });
        await Promise.all(allRequestPromises);
        return allFeatureResponse;
    }
}

/**
 * Returns true if the service supports paging via `offset` parameter.
 */
export async function supportsOffsetStrategy(
    collectionsItemsUrl: string,
    httpService: HttpService
): Promise<boolean> {
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
    const nextUrl = getNextLink(jsonResp.links);
    if (!nextUrl) {
        return false;
    }

    const parsedURL = new URL(nextUrl);
    const hasOffset = parsedURL.searchParams.has("offset");
    return hasOffset;
}

/**
 * Adds (or replaces) offset/limit params on the given url.
 */
function createOffsetUrl(fullUrl: URL, offset: number, pageSize: number): URL {
    const url = new URL(fullUrl);
    const searchParams = url.searchParams;
    searchParams.set("offset", offset.toString());
    searchParams.set("limit", pageSize.toString());
    return url;
}
