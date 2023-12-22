// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Extent } from "ol/extent";
import FeatureFormat from "ol/format/Feature";
import { FeatureLike } from "ol/Feature";
import { HttpService } from "@open-pioneer/http";

const NEXT_LINK_PROP = "next";

/**
 * Assembles the url to use for fetching features in the given extent.
 */
export function createCollectionRequestUrl(
    collectionItemsURL: string,
    extent: Extent,
    crs: string
): URL {
    const urlObj = new URL(collectionItemsURL);
    const searchParams = urlObj.searchParams;
    searchParams.set("bbox", extent.join(","));
    searchParams.set("bbox-crs", crs);
    searchParams.set("crs", crs);
    searchParams.set("f", "json");
    return urlObj;
}

/**
 * Adds (or replaces) offset/limit params on the given url.
 */
export function createOffsetURL(fullURL: string, offset: number, pageSize: number): string {
    const url = new URL(fullURL);
    const searchParams = url.searchParams;
    searchParams.set("offset", offset.toString());
    searchParams.set("limit", pageSize.toString());
    return url.toString();
}

/**
 * Extracts the `next` link from the service response's `links` property.
 */
export function getNextURL(rawLinks: unknown): string | undefined {
    if (!Array.isArray(rawLinks)) {
        return undefined;
    }

    interface ObjWithRelAndHref {
        href: string;
        rel: string;
    }

    // We just assume the correct object shape
    const links = rawLinks as ObjWithRelAndHref[];

    const nextLinks = links.filter((link) => link.rel === NEXT_LINK_PROP);
    if (nextLinks.length !== 1) return;
    return nextLinks[0]?.href;
}

export interface FeatureResponse {
    features: FeatureLike[];
    nextURL: string | undefined;
    numberMatched: number | undefined;
}

/**
 * Performs a single request against the service
 */
export async function queryFeatures(
    fullURL: string,
    featureFormat: FeatureFormat | undefined,
    httpService: HttpService,
    signal: AbortSignal | undefined
): Promise<FeatureResponse> {
    let features: FeatureLike[] = [];
    const requestInit: RequestInit = {
        headers: {
            Accept: "application/geo+json"
        },
        signal
    };
    const response = await httpService.fetch(fullURL, requestInit);
    if (response.status !== 200) {
        throw new Error(`Failed to query features from service (status code ${response.status})`);
    }
    const geoJson = await response.json();
    if (featureFormat) {
        features = featureFormat.readFeatures(geoJson);
    }
    const nextURL = getNextURL(geoJson.links);
    return {
        features: features,
        numberMatched: geoJson.numberMatched,
        nextURL: nextURL
    };
}
