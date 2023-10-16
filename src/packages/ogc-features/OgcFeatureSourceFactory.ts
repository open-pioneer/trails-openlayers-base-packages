// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import VectorSource, { Options } from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { bbox } from "ol/loadingstrategy";
import { createLogger, isAbortError } from "@open-pioneer/core";
import { FeatureLike } from "ol/Feature";
import { Geometry } from "ol/geom";
import FeatureFormat from "ol/format/Feature";
import { AttributionLike } from "ol/source/Source";
import {
    OffsetRequestProps,
    getCollectionInfos,
    queryAllFeaturesWithOffset,
    defaultOffsetRequestProps,
    CollectionInfos
} from "./OffsetStrategy";
import { FeatureLoader } from "ol/featureloader";
import { Extent } from "ol/extent";

const NEXT_LINK_PROP = "next";
const DEFAULT_LIMIT = 5000;
const LOG = createLogger("ogc-features:OgcFeatureSourceFactory");

export { type OffsetRequestProps } from "./OffsetStrategy";

export interface OgcFeatureSourceOptions {
    /** The base-URL right to the "/collections"-part */
    baseUrl: string;

    /** The collection-ID */
    collectionId: string;

    /** the URL to the EPSG-Code, e.g. http://www.opengis.net/def/crs/EPSG/0/25832 */
    crs: string;

    /**
     * The maximum number of features to fetch within a single request.
     * Corresponds to the `limit` parameter in the URL.
     *
     * When the `offset` strategy is used for feature fetching, the limit
     * is used for the page size
     *
     * TODO: Think about limit and pageSize again
     * Default limit is 5000
     */
    limit?: number;

    /** Optional attribution for the layer (e.g. copyright hints). */
    attributions?: AttributionLike | undefined;

    /** Configuration options for the 'offset' strategy. TODO: configuration? */
    offsetRequestProps?: OffsetRequestProps;

    /** Optional additional options for the VectorSource. */
    additionalOptions?: Options<Geometry>;
}

/**
 * This function creates an ol-VectorSource for OGC-API-Feature-Services to be used inside
 * an ol-VectorLayer
 *
 * @param options Options for the vector source.
 */
export function createVectorSource(options: OgcFeatureSourceOptions): VectorSource {
    return _createVectorSource(options, undefined, undefined, undefined);
}

export interface FeatureResponse {
    features: Array<FeatureLike>;
    nextURL: string | undefined;
}

/**
 * @internal
 * Creates the actual vector source.
 * Exported for testing.
 * Exposes `queryFeatures`, `addFeatures` and `getCollectionInfos` for easier testing.
 */
export function _createVectorSource(
    options: OgcFeatureSourceOptions,
    queryFeaturesParam: QueryFeaturesFunc | undefined,
    addFeaturesParam: AddFeaturesFunc | undefined,
    getCollectionInfosParam: GetCollectionInfosFunc | undefined
): VectorSource {
    const collectionItemsURL = `${options.baseUrl}/collections/${options.collectionId}/items?`;
    const vectorSrc = new VectorSource({
        format: new GeoJSON(),
        strategy: bbox,
        attributions: options.attributions,
        ...options.additionalOptions
    });

    const offsetRequestProps = options.offsetRequestProps ?? defaultOffsetRequestProps;
    const queryFeaturesFunc = queryFeaturesParam ?? queryFeatures;
    const getCollectionInfosFunc = getCollectionInfosParam ?? getCollectionInfos;
    const addFeaturesFunc =
        addFeaturesParam ||
        function (features: FeatureLike[]) {
            LOG.debug(`Adding ${features.length} features`);

            // Type mismatch FeatureLike <--> Feature<Geometry>
            // MIGHT be incorrect! We will see.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vectorSrc.addFeatures(features as any);
        };

    // Abort controller for the currently pending request.
    // Used to cancel outdated requests.
    let abortController: AbortController;
    let collectionInfos: CollectionInfos | undefined;

    const loaderFunction: FeatureLoader = async (
        extent,
        _,
        __,
        success,
        failure
    ): Promise<void> => {
        if (!collectionInfos) {
            collectionInfos = await getCollectionInfosFunc(collectionItemsURL, offsetRequestProps);
        }

        if (abortController) {
            // An extent-change should cancel open requests for older extents, because otherwise,
            // old and expensive requests could block new requests for a new extent
            // => no features are drawn on the current map for a long time.
            abortController.abort("Extent changed");
        }

        const fullURL = initCollectionRequestUrl(collectionItemsURL, extent, options);

        abortController = new AbortController();
        const strategy = collectionInfos?.offsetStrategySupported ? "offset" : "next";
        try {
            const features = await queryAllFeatures(strategy, {
                fullURL: fullURL.toString(),
                featureFormat: vectorSrc.getFormat()!, // TODO
                queryFeatures: queryFeaturesFunc,
                addFeatures: addFeaturesFunc,
                limit: options.limit,
                signal: abortController.signal,
                offsetRequestProps: offsetRequestProps,
                collectionInfos: collectionInfos
            });
            // Type mismatch FeatureLike <--> Feature<Geometry>
            // MIGHT be incorrect! We will see.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            success && success(features as any);
            LOG.debug("Finished loading features for extent:", extent);
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error(e);
            } else {
                LOG.debug("Query-Feature-Request aborted", e);
                vectorSrc.removeLoadedExtent(extent);
                failure && failure();
            }
        }
    };
    vectorSrc.setLoader(loaderFunction);
    return vectorSrc;
}

/** @internal **/
type QueryFeaturesFunc = typeof queryFeatures;
/** @internal **/
type GetCollectionInfosFunc = typeof getCollectionInfos;
/** @internal **/
type AddFeaturesFunc = (features: FeatureLike[]) => void;

/** @internal **/
export interface QueryFeatureOptions {
    fullURL: string;
    featureFormat: FeatureFormat;
    queryFeatures: QueryFeaturesFunc;
    addFeatures: AddFeaturesFunc;
    limit?: number;
    signal?: AbortSignal;
    offsetRequestProps?: OffsetRequestProps;
    collectionInfos?: CollectionInfos;
}

/**
 * @internal
 * Fetches _all_ features according to the given strategy.
 */
function queryAllFeatures(
    strategy: "next" | "offset",
    options: QueryFeatureOptions
): Promise<FeatureLike[]> {
    switch (strategy) {
        case "next":
            return queryAllFeaturesNextStrategy(options);

        case "offset":
            return queryAllFeaturesWithOffset(options);
    }
}

/**
 * @internal
 * Fetches features by following the `next` links in the server's response.
 */
export async function queryAllFeaturesNextStrategy(
    options: Omit<QueryFeatureOptions, "offsetRequestProps" | "collectionInfos">
): Promise<FeatureLike[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;

    const url = new URL(options.fullURL);
    url.searchParams.set("limit", limit.toString());
    let urls = [url.toString()];
    let allFeatures: FeatureLike[] = [];
    let featureResp: FeatureResponse;
    do {
        featureResp = await queryPages(
            urls,
            options.featureFormat,
            options.signal,
            options.addFeatures,
            options.queryFeatures
        );
        allFeatures = allFeatures.concat(featureResp.features);
        urls = [featureResp.nextURL || ""];
    } while (featureResp.nextURL !== undefined);
    return allFeatures;
}

/**
 * @internal
 * Performs a single request against the service
 */
export async function queryFeatures(
    fullURL: string,
    featureFormat: FeatureFormat | undefined,
    signal: AbortSignal | undefined
): Promise<FeatureResponse> {
    let featureArr = new Array<FeatureLike>();
    const requestInit: RequestInit = {
        headers: {
            Accept: "application/geo+json"
        }
    };
    if (signal !== undefined) requestInit.signal = signal;
    const response = await fetch(fullURL, requestInit);
    if (response.status !== 200) {
        LOG.error(`Request failed with status ${response.status}:`, response);
        return {
            features: featureArr,
            nextURL: undefined
        };
    }
    const geoJson = await response.json();
    if (featureFormat) featureArr = featureFormat.readFeatures(geoJson);
    const nextURL = getNextURL(geoJson.links);
    return {
        features: featureArr,
        nextURL: nextURL
    };
}

export async function loadFeatures(
    requestUrl: string,
    featureFormat: FeatureFormat,
    signal: AbortSignal | undefined,
    addFeaturesFunc: AddFeaturesFunc,
    queryFeaturesFunc: QueryFeaturesFunc = queryFeatures
): Promise<FeatureResponse> {
    const featureResponse = await queryFeaturesFunc(requestUrl, featureFormat, signal);
    const features = featureResponse.features as FeatureLike[];
    addFeaturesFunc(features);
    return featureResponse;
}

/** @internal */
export async function queryPages(
    allUrls: Array<string>,
    featureFormat: FeatureFormat,
    signal: AbortSignal | undefined,
    addFeaturesFunc: AddFeaturesFunc,
    queryFeaturesFunc: QueryFeaturesFunc = queryFeatures
): Promise<FeatureResponse> {
    const allFeatureResponse: FeatureResponse = {
        nextURL: undefined,
        features: []
    };
    const allRequestPromises = allUrls.map(async (singleUrl, index): Promise<void> => {
        const isLast = index === allUrls.length - 1;
        const featureResponse = await loadFeatures(
            singleUrl,
            featureFormat,
            signal,
            addFeaturesFunc,
            queryFeaturesFunc
        );
        LOG.debug(
            `NextURL for index = ${index} (isLast = ${isLast}): ${
                featureResponse.nextURL || "No Next URL"
            }`
        );
        allFeatureResponse.features = allFeatureResponse.features.concat(featureResponse.features);
        if (isLast) allFeatureResponse.nextURL = featureResponse.nextURL;
    });
    await Promise.all(allRequestPromises);
    return allFeatureResponse;
}

/** @internal */
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

/** @internal */
export function initCollectionRequestUrl(
    collectionItemsURL: string,
    extent: Extent,
    options: OgcFeatureSourceOptions
): URL {
    const urlObj = new URL(collectionItemsURL);
    const searchParams = urlObj.searchParams;
    searchParams.set("bbox", extent.join(","));
    searchParams.set("bbox-crs", options.crs);
    searchParams.set("crs", options.crs);
    searchParams.set("f", "json");
    return urlObj;
}
