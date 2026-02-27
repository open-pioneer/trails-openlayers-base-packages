// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { sourceId } from "open-pioneer:source-info";

/**
 * @module
 *
 * Provides metadata-related utilities for working with OGC API Features services, such as fetching collection metadata.
 *
 *
 */

const LOG = createLogger(sourceId);

/**
 * Requests metadata for an OGC API Features service collection.
 *
 * @param baseUrl Base URL of the OGC API Features service (e.g. `https://example.com/ogcapi/v1`).
 * @param collectionId ID of the collection to retrieve the metadata for.
 * @param httpService Instance to perform the HTTP request.
 * @returns
 */
export async function getCollectionMetadata(
    baseUrl: string,
    collectionId: string,
    httpService: HttpService
): Promise<CollectionMetadata> {
    const collectionMetadataUrl = `${baseUrl}/collections/${collectionId}`;
    const response = await httpService.fetch(collectionMetadataUrl, {
        headers: {
            Accept: "application/json"
        }
    });
    if (!response.ok) {
        throw new Error(
            `Failed to fetch collection metadata for collection '${collectionId}' (status code ${response.status})`
        );
    }
    // Note: Currently no validation
    return await response.json();
}

/**
 * Metadata of a collection retrieved from the OGC API Features service as provided by the `/collections/{collectionId}` endpoint.
 */
export interface CollectionMetadata {
    id: string;
    crs: string[] | undefined;
    attribution?: string;
}

/**
 * Determines the appropriate coordinate reference system (CRS) identifier to use for requests to the OGC API Features service, based on the map's current CRS, the collection's supported CRSs, and any explicitly configured CRS in the options.
 *
 * @param mapCrs the CRS used by the map that is requesting to load the features.
 * @param supportedCrses list of supported CRS identifiers.
 * @param configuredCrs an explicitly configured CRS identifier to use for requests, if any.
 * @returns the CRS to use for feature requests based on the given information.
 */
export function getRequestCrs(
    mapCrs: string,
    supportedCrses: string[] | undefined,
    configuredCrs: string | undefined
): string {
    if (configuredCrs) {
        return configuredCrs;
    }

    const DEFAULT_CRS = "http://www.opengis.net/def/crs/OGC/1.3/CRS84";
    const matchingMapCrs = findMatchingCrs(mapCrs, supportedCrses);
    if (!matchingMapCrs) {
        LOG.warn(
            `Map CRS '${mapCrs}' not supported. Falling back to default CRS '${DEFAULT_CRS}'.`
        );
        return DEFAULT_CRS;
    }

    return matchingMapCrs;
}

/**
 * Checks if a given coordinate reference system (CRS) identifier  matches any of the available CRS URIs.
 * The function especially supports matching a simple EPSG code like "EPSG:4326" with its corresponding CRS URI (e.g. "http://www.opengis.net/def/crs/EPSG/0/4326").
 *
 *
 * @param testCrs a CRS identifier to test, e.g. "EPSG:4326" or "http://www.opengis.net/def/crs/EPSG/0/4326"
 * @param availableCrsUris list of CRS URIs to check against, expected to be in the form of "http://www.opengis.net/def/crs/{authority}/{version}/{code}".
 *
 * @returns the matching CRS URI if a match is found, otherwise `undefined`.
 */

export function findMatchingCrs(
    testCrs: string,
    availableCrsUris: string[] | undefined
): string | undefined {
    if (!availableCrsUris) {
        return undefined;
    }

    if (testCrs.startsWith("EPSG:")) {
        const testCode = testCrs.split(":")[1];
        const testCrsUri = `http://www.opengis.net/def/crs/EPSG/0/${testCode}`;
        return availableCrsUris.find((crsUri) => crsUri === testCrsUri);
    } else {
        return availableCrsUris.find((crsUri) => crsUri === testCrs);
    }
}
