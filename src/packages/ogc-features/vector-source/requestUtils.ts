// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Extent } from "ol/extent";
import FeatureFormat from "ol/format/Feature";
import Feature from "ol/Feature";
import { HttpService } from "@open-pioneer/http";

const NEXT_LINK_PROP = "next";

/**
 * Assembles the url to use for fetching features in the given extent.
 */
export function createCollectionRequestUrl(
    collectionItemsUrl: string,
    extent: Extent,
    crs: string
): URL {
    const url = new URL(collectionItemsUrl);
    const searchParams = url.searchParams;
    searchParams.set("bbox", extent.join(","));
    searchParams.set("bbox-crs", crs);
    searchParams.set("crs", crs);
    searchParams.set("f", "json");
    return url;
}

/**
 * Extracts the `next` link from the service response's `links` property.
 */
export function getNextLink(rawLinks: unknown): string | undefined {
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
    features: Feature[];
    nextLink: string | undefined;
    numberMatched: number | undefined;
}

/**
 * Performs a single request against the service
 */
export async function queryFeatures(
    fullUrl: URL,
    featureFormat: FeatureFormat,
    httpService: HttpService,
    signal: AbortSignal | undefined
): Promise<FeatureResponse> {
    const response = await httpService.fetch(fullUrl, {
        headers: {
            Accept: "application/geo+json"
        },
        signal
    });
    if (response.status !== 200) {
        throw new Error(`Failed to query features from service (status code ${response.status})`);
    }
    const geoJson = await response.json();
    const features = featureFormat.readFeatures(geoJson);
    const nextLink = getNextLink(geoJson.links);
    return {
        features,
        numberMatched: geoJson.numberMatched,
        nextLink
    };
}
