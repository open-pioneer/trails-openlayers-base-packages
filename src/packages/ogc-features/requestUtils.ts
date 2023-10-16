// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Extent } from "ol/extent";

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
