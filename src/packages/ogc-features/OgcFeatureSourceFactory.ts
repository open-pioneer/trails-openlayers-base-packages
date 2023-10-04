// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import VectorSource, { Options } from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { bbox } from "ol/loadingstrategy";
import { Extent } from "ol/extent";
import { createLogger } from "@open-pioneer/core";
import { FeatureLike } from "ol/Feature";
import { Geometry } from "ol/geom";
import { Feature } from "ol";
import FeatureFormat from "ol/format/Feature";
import { AttributionLike } from "ol/source/Source";

const NEXT_LINK_PROP = "next";
const logger = createLogger("ogc-feature-api-layer:OgcFeatureSourceFactory");

export interface FeatureResponse {
    features: Array<FeatureLike>;
    nextURL: string | undefined;
}

export type OffsetRequestProps = {
    numberOfConcurrentReq: number; // 6
    offsetDelta: number; // 2500
    startOffset: number; //0
};

// Chrome does only allow 6 concurrent requests
export const defaultOffsetRequestProps: OffsetRequestProps = {
    numberOfConcurrentReq: 6,
    offsetDelta: 2500,
    startOffset: 0
};

export interface ObjWithRelAndHref {
    href: string;
    rel: string;
}

export function _getNextURL(links: Array<ObjWithRelAndHref>): string | undefined {
    const nextLinks = links.filter((link) => link.rel === NEXT_LINK_PROP);
    if (nextLinks.length !== 1) return;
    const nextLink = nextLinks.at(0);
    if (nextLink) {
        return nextLink.href;
    }
}

export function _createOffsetURLs(
    fullURL: string,
    numberOfRequests: number = 10,
    startOffset: number = 0,
    offsetDelta: number = 5000
): Array<string> {
    const allRequests = [];
    let currentOffset = startOffset;
    for (let i = 0; i < numberOfRequests; i++) {
        allRequests.push(`${fullURL}&offset=${currentOffset}&limit=${offsetDelta}`);
        currentOffset += offsetDelta;
    }
    return allRequests;
}

export const _queryFeatures = async (
    fullURL: string,
    featureFormat: FeatureFormat | undefined,
    signal: AbortSignal
): Promise<FeatureResponse> => {
    let featureArr = new Array<FeatureLike>();
    const response = await fetch(fullURL, {
        headers: {
            Accept: "application/geo+json"
        },
        signal: signal
    });
    if (response.status !== 200) {
        logger.error(`Request failed with status ${response.status}:`, response);
        return {
            features: featureArr,
            nextURL: undefined
        };
    }
    const geoJson = await response.json();
    if (featureFormat) featureArr = featureFormat.readFeatures(geoJson);
    const nextURL = _getNextURL(Array.from(geoJson.links));
    return {
        features: featureArr,
        nextURL: nextURL
    };
};

export const _queryAllFeatureRequests = async (
    fullURL: string,
    featureFormat: FeatureFormat | undefined,
    queryFeatures = _queryFeatures,
    signal: AbortSignal,
    failure: () => void,
    addFeatures: (features: Array<Feature<Geometry>>) => void,
    offsetProps: OffsetRequestProps = defaultOffsetRequestProps
): Promise<Array<Feature>> => {
    let noMoreNextURLs = false;
    let allFeatures: Array<Feature> = [];
    // eslint-disable-next-line prefer-const
    let { numberOfConcurrentReq, startOffset, offsetDelta } = offsetProps;
    do {
        const allRequests = _createOffsetURLs(
            fullURL,
            numberOfConcurrentReq,
            startOffset,
            offsetDelta
        );
        const allRequestPromises = allRequests.map(async (singleRequest, index) => {
            const isLast = index === allRequests.length - 1;
            const featureResp = await queryFeatures(singleRequest, featureFormat, signal);
            logger.debug(
                `NextURL for index = ${index} (isLast = ${isLast}): ${
                    featureResp.nextURL || "No Next URL"
                }`
            );
            const features = featureResp.features as Array<Feature>;
            addFeatures(features);
            allFeatures = allFeatures.concat(features);
            if (isLast) noMoreNextURLs = featureResp.nextURL == undefined;
        });
        await Promise.all(allRequestPromises);
        startOffset += numberOfConcurrentReq * offsetDelta;
    } while (!noMoreNextURLs);
    return allFeatures;
};

export function _createVectorSource(
    options: OgcFeatureSourceOptions,
    queryFeatures = _queryFeatures,
    addFeatures: ((features: Array<Feature<Geometry>>) => void) | undefined
): VectorSource {
    const collectionItemsURL = `${options.baseUrl}/collections/${options.collectionId}/items?`;
    const vectorSrc = new VectorSource({
        format: new GeoJSON(),
        strategy: bbox,
        attributions: options.attributions,
        ...options.additionalOptions
    });
    const offsetProps = options.offsetRequestProps || defaultOffsetRequestProps;

    let abortController: AbortController;

    const loaderFunction = async (
        extent: Extent,
        _: number,
        __: unknown,
        success: ((features: Array<Feature>) => void) | undefined,
        failure: (() => void) | undefined
    ): Promise<void> => {
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
        const onError = function () {
            vectorSrc.removeLoadedExtent(extent);
            failure && failure();
        };

        const addFeaturesFunc =
            addFeatures ||
            function (features: Array<Feature<Geometry>>) {
                logger.info(`Adding ${features.length} features`);
                vectorSrc.addFeatures(features);
            };

        _queryAllFeatureRequests(
            fullURL,
            vectorSrc.getFormat(),
            queryFeatures,
            abortController.signal,
            onError,
            addFeaturesFunc,
            offsetProps
        )
            .then((features) => {
                success && success(features);
                logger.debug("Finished loading features for extent:", extent);
            })
            .catch((e) => {
                if (e.name !== "AbortError") {
                    logger.error(e);
                } else {
                    logger.debug("Query-Feature-Request aborted", e);
                    onError();
                }
            });
    };
    vectorSrc.setLoader(loaderFunction);
    return vectorSrc;
}

export type OgcFeatureSourceOptions = {
    baseUrl: string;
    collectionId: string;
    crs: string;
    attributions?: AttributionLike | undefined;
    offsetRequestProps?: OffsetRequestProps;
    additionalOptions?: Options<Geometry>;
};

/**
 * This function creates an ol-VectorSource for OGC-API-Feature-Services to be used inside
 * an ol-VectorLayer
 * @param options {
 *          ogcFeatureApiBaseUrl: The base-URL right to the "/collections"-part
 *          collectionId: The collection-ID
 *          crs: the URL to the EPSG-Code, e.g. "http://www.opengis.net/def/crs/EPSG/0/25832
 *          attributions?: Optional default ol-VectorSource-Property
 *          offsetRequestProps?: Optional config values of
 *          additionalOptions?: Optional additional options for the VectorSource
 * }
 */
export function createVectorSource(options: OgcFeatureSourceOptions): VectorSource {
    return _createVectorSource(options, _queryFeatures, undefined);
}
