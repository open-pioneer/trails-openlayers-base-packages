// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, isAbortError } from "@open-pioneer/core";
import Feature, { FeatureLike } from "ol/Feature";
import { FeatureLoader } from "ol/featureloader";
import FeatureFormat from "ol/format/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Geometry } from "ol/geom";
import { bbox } from "ol/loadingstrategy";
import { AttributionLike } from "ol/source/Source";
import VectorSource, { Options } from "ol/source/Vector";
import { CollectionInfos, getCollectionInfos, loadAllFeaturesWithOffset } from "./OffsetStrategy";
import { FeatureResponse, createCollectionRequestUrl, queryFeatures } from "./requestUtils";

const LOG = createLogger("ogc-features:OgcFeatureSourceFactory");
const DEFAULT_LIMIT = 5000;
const DEFAULT_CONCURRENTY = 6;

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
     * Default limit is 5000 for Next-Strategy and 2500 for Offset-Strategy
     */
    limit?: number;

    /** The maximum number of concurrent requests. Defaults to `6`. */
    maxConcurrentRequests?: number;

    /** Optional attribution for the layer (e.g. copyright hints). */
    attributions?: AttributionLike | undefined;

    /** Optional additional options for the VectorSource. */
    additionalOptions?: Options<Feature<Geometry>>;
}

/**
 * This function creates an OpenLayers VectorSource for OGC Features API services to be used inside
 * an OpenLayers VectorLayer.
 *
 * @param options Options for the vector source.
 */
export function createVectorSource(options: OgcFeatureSourceOptions): VectorSource {
    return _createVectorSource(options, undefined, undefined, undefined);
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

    // Abort controller for the currently pending request(s).
    // Used to cancel outdated requests.
    let abortController: AbortController;
    let collectionInfosPromise: Promise<CollectionInfos | undefined> | undefined;

    const loaderFunction: FeatureLoader = async (
        extent,
        _,
        __,
        success,
        failure
    ): Promise<void> => {
        collectionInfosPromise ??= getCollectionInfosFunc(collectionItemsURL);
        let collectionInfos;
        try {
            collectionInfos = await collectionInfosPromise;
        } catch (e) {
            LOG.error("Failed to retrieve collection information", e);
            failure?.();
            collectionInfosPromise = undefined;
            return;
        }

        // An extent-change should cancel open requests for older extents, because otherwise,
        // old and expensive requests could block new requests for a new extent
        // => no features are drawn on the current map for a long time.
        abortController?.abort("Extent changed");
        abortController = new AbortController();

        const fullURL = createCollectionRequestUrl(collectionItemsURL, extent, options.crs);
        const strategy = collectionInfos?.supportsOffsetStrategy ? "offset" : "next";
        try {
            const features = await loadAllFeatures(strategy, {
                fullURL: fullURL.toString(),
                featureFormat: vectorSrc.getFormat()!, // TODO
                queryFeatures: queryFeaturesFunc,
                addFeatures: addFeaturesFunc,
                limit: options.limit ?? DEFAULT_LIMIT,
                maxConcurrentRequests: options.maxConcurrentRequests ?? DEFAULT_CONCURRENTY,
                signal: abortController.signal,
                collectionInfos: collectionInfos
            });
            // Type mismatch FeatureLike <--> Feature<Geometry>
            // MIGHT be incorrect! We will see.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            success?.(features as any);
            LOG.debug("Finished loading features for extent:", extent);
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error("Failed to load features", e);
            } else {
                LOG.debug("Query-Feature-Request aborted", e);
                vectorSrc.removeLoadedExtent(extent);
                failure?.();
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
export interface LoadFeatureOptions {
    fullURL: string;
    featureFormat: FeatureFormat;
    queryFeatures: QueryFeaturesFunc;
    addFeatures: AddFeaturesFunc;
    limit: number;
    maxConcurrentRequests: number;
    signal?: AbortSignal;
    collectionInfos?: CollectionInfos;
}

/**
 * @internal
 * Fetches _all_ features according to the given strategy.
 */
function loadAllFeatures(
    strategy: "next" | "offset",
    options: LoadFeatureOptions
): Promise<FeatureLike[]> {
    switch (strategy) {
        case "next":
            return loadAllFeaturesNextStrategy(options);
        case "offset":
            return loadAllFeaturesWithOffset(options);
    }
}

/**
 * @internal
 * Fetches features by following the `next` links in the server's response.
 */
export async function loadAllFeaturesNextStrategy(
    options: Omit<LoadFeatureOptions, "offsetRequestProps" | "collectionInfos">
): Promise<FeatureLike[]> {
    const limit = options.limit;

    let url = new URL(options.fullURL);
    url.searchParams.set("limit", limit.toString());
    let allFeatures: FeatureLike[] = [];
    do {
        const featureResp = await loadPages(
            [url.toString()],
            options.featureFormat,
            options.signal,
            options.addFeatures,
            options.queryFeatures
        );

        allFeatures = allFeatures.concat(featureResp.features);
        if (!featureResp.nextURL) {
            break;
        }

        url = new URL(featureResp.nextURL);
        // eslint-disable-next-line no-constant-condition
    } while (1);
    return allFeatures;
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

/**
 * Loads features from multiple urls in parallel.
 * The URLs should represent pages of the same result set.
 * The `nextURL` of the last page (if any) is returned from this function.
 *
 * @internal
 */
export async function loadPages(
    allUrls: Array<string>,
    featureFormat: FeatureFormat,
    signal: AbortSignal | undefined,
    addFeaturesFunc: AddFeaturesFunc,
    queryFeaturesFunc: QueryFeaturesFunc = queryFeatures
): Promise<FeatureResponse> {
    const allFeatureResponse: FeatureResponse = {
        nextURL: undefined,
        numberMatched: undefined,
        features: []
    };
    const allRequestPromises = allUrls.map(async (singleUrl, index): Promise<void> => {
        const isLast = index === allUrls.length - 1;

        const featureResponse = await queryFeaturesFunc(singleUrl, featureFormat, signal);
        addFeaturesFunc(featureResponse.features as FeatureLike[]);

        LOG.debug(
            `NextURL for index = ${index} (isLast = ${isLast}): ${
                featureResponse.nextURL || "No Next URL"
            }`
        );
        allFeatureResponse.features.push(...featureResponse.features);
        if (isLast) {
            allFeatureResponse.numberMatched = featureResponse.numberMatched;
            allFeatureResponse.nextURL = featureResponse.nextURL;
        }
    });
    await Promise.all(allRequestPromises);
    return allFeatureResponse;
}
