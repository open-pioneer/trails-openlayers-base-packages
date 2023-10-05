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
    isOffsetStrategySupported,
    _queryAllFeaturesWithOffset
} from "./OffsetStrategy";
import { FeatureLoader } from "ol/featureloader";

const NEXT_LINK_PROP = "next";
const NO_LIMIT = 1000000;
const LOG = createLogger("ogc-features:OgcFeatureSourceFactory");

export interface NextRequestProps {
    /** The limit for individual item queries. */
    limit: number;
}

export { type OffsetRequestProps } from "./OffsetStrategy";

export interface OgcFeatureSourceOptions {
    /** The base-URL right to the "/collections"-part */
    baseUrl: string;

    /** The collection-ID */
    collectionId: string;

    /** the URL to the EPSG-Code, e.g. "http://www.opengis.net/def/crs/EPSG/0/25832 */
    crs: string;

    /**
     * The maximum number of features to fetch within a single request.
     * Corresponds to the `limit` parameter in the URL.
     * 
     * When the `offset` strategy is used for feature fetching, the limit
     * is used for the page size.
     * 
     * TODO: default value?
     * 
     * TODO
     */
    limit?: number;

    /** Optional attribution for the layer (e.g. copyright hints). */
    attributions?: AttributionLike | undefined;

    /** Configuration options for the 'offset' strategy. TODO: configuration? */
    offsetRequestProps?: OffsetRequestProps;

    /** Configuration options for the 'next' strategy. TODO: configuration */
    nextRequestProps?: NextRequestProps;

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
    return _createVectorSource(options, undefined, undefined);
}

export interface FeatureResponse {
    features: Array<FeatureLike>;
    nextURL: string | undefined;
}

export const defaultNextRequestProps: NextRequestProps = {
    limit: NO_LIMIT
};

/**
 * Creates the actual vector source.
 * Exported for testing.
 * Exposes `queryFeatures` and `addFeatures` for easier testing.
 */
export function _createVectorSource(
    options: OgcFeatureSourceOptions,
    queryFeatures: QueryFeaturesFunc | undefined,
    addFeatures: AddFeaturesFunc | undefined
): VectorSource {
    const collectionItemsURL = `${options.baseUrl}/collections/${options.collectionId}/items?`;
    const vectorSrc = new VectorSource({
        format: new GeoJSON(),
        strategy: bbox,
        attributions: options.attributions,
        ...options.additionalOptions
    });

    const queryFeaturesFunc = queryFeatures ?? _queryFeatures;
    const addFeaturesFunc =
        addFeatures ||
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
    let isOffsetSupported: boolean | undefined;
    const loaderFunction: FeatureLoader = async (
        extent,
        _,
        __,
        success,
        failure
    ): Promise<void> => {
        if (isOffsetSupported == null) {
            isOffsetSupported = await isOffsetStrategySupported(collectionItemsURL);
        }

        const fullURL = `${collectionItemsURL}bbox=${extent.join(",")}&bbox-crs=${
            options.crs
        }&crs=${options.crs}&f=json`;

        if (abortController) {
            // An extent-change should cancel open requests for older extents, because otherwise,
            // old and expensive requests could block new requests for a new extent
            // => no features are drawn on the current map for a long time.
            abortController.abort("Extent changed");
        }

        abortController = new AbortController();
        const strategy = isOffsetSupported ? "offset" : "next";
        try {
            const features = await queryAllFeatures(strategy, {
                fullURL,
                featureFormat: vectorSrc.getFormat()!, // TODO
                queryFeatures: queryFeaturesFunc,
                addFeatures: addFeaturesFunc,
                signal: abortController.signal,
                offsetRequestProps: options.offsetRequestProps,
                nextRequestProps: options.nextRequestProps
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

type QueryFeaturesFunc = typeof _queryFeatures;

type AddFeaturesFunc = (features: FeatureLike[]) => void;

export interface QueryFeatureOptions {
    fullURL: string;
    featureFormat: FeatureFormat;
    queryFeatures: QueryFeaturesFunc;
    addFeatures: AddFeaturesFunc;
    signal?: AbortSignal;
    nextRequestProps?: NextRequestProps;
    offsetRequestProps?: OffsetRequestProps;
}

/**
 * Fetches _all_ features according to the given strategy.
 */
function queryAllFeatures(strategy: "next" | "offset", options: QueryFeatureOptions) {
    switch (strategy) {
        case "next":
            return _queryAllFeaturesNextStrategy(options);

        case "offset":
            return _queryAllFeaturesWithOffset(options);
    }
}

/**
 * Fetches features by following the `next` links in the server's response.
 */
export const _queryAllFeaturesNextStrategy = async (
    options: Omit<QueryFeatureOptions, "offsetRequestProps">
): Promise<FeatureLike[]> => {
    const limit = options.nextRequestProps?.limit ?? NO_LIMIT;

    let urls = [`${options.fullURL}&limit=${limit}`];
    let allFeatures: FeatureLike[] = [];
    let featureResp: FeatureResponse;
    do {
        featureResp = await _queryPages(
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
};

/**
 * Performs a single request against the service
 */
export const _queryFeatures = async (
    fullURL: string,
    featureFormat: FeatureFormat | undefined,
    signal: AbortSignal | undefined
): Promise<FeatureResponse> => {
    let featureArr = new Array<FeatureLike>();
    const response = await fetch(fullURL, {
        headers: {
            Accept: "application/geo+json"
        },
        signal: signal
    });
    if (response.status !== 200) {
        LOG.error(`Request failed with status ${response.status}:`, response);
        return {
            features: featureArr,
            nextURL: undefined
        };
    }
    const geoJson = await response.json();
    if (featureFormat) featureArr = featureFormat.readFeatures(geoJson);
    const nextURL = _getNextURL(geoJson.links);
    return {
        features: featureArr,
        nextURL: nextURL
    };
};

// TODO: Refactor into single "load" function
export const _queryPages = async (
    allUrls: Array<string>,
    featureFormat: FeatureFormat,
    signal: AbortSignal | undefined,
    addFeatures: AddFeaturesFunc,
    queryFeatures: QueryFeaturesFunc = _queryFeatures
): Promise<FeatureResponse> => {
    const allFeatureResponse: FeatureResponse = {
        nextURL: undefined,
        features: []
    };
    const allRequestPromises = allUrls.map(async (singleUrl, index): Promise<void> => {
        const isLast = index === allUrls.length - 1;
        const singleFeatureResp = await queryFeatures(singleUrl, featureFormat, signal);
        LOG.debug(
            `NextURL for index = ${index} (isLast = ${isLast}): ${
                singleFeatureResp.nextURL || "No Next URL"
            }`
        );
        const features = singleFeatureResp.features as FeatureLike[];
        addFeatures(features);
        allFeatureResponse.features = allFeatureResponse.features.concat(features);
        if (isLast) allFeatureResponse.nextURL = singleFeatureResp.nextURL;
    });
    await Promise.all(allRequestPromises);
    return allFeatureResponse;
};


export function _getNextURL(rawLinks: unknown): string | undefined {
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
    return nextLinks.at(0)?.href;
}
