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
import {
    OffsetRequestProps,
    isOffsetStrategySupported,
    _queryAllFeaturesWithOffset
} from "./OffsetStrategy";

const NEXT_LINK_PROP = "next";
const NO_LIMIT = 1000000;
const logger = createLogger("ogc-feature-api-layer:OgcFeatureSourceFactory");

export interface FeatureResponse {
    features: Array<FeatureLike>;
    nextURL: string | undefined;
}

export interface ObjWithRelAndHref {
    href: string;
    rel: string;
}

export type NextRequestProps = {
    limit: number; // 6
};

export const defaultNextRequestProps: NextRequestProps = {
    limit: NO_LIMIT
};

export type OgcFeatureSourceOptions = {
    baseUrl: string;
    collectionId: string;
    crs: string;
    attributions?: AttributionLike | undefined;
    offsetRequestProps?: OffsetRequestProps;
    additionalOptions?: Options<Geometry>;
    nextRequestProps?: NextRequestProps;
};

export function _getNextURL(links: Array<ObjWithRelAndHref>): string | undefined {
    const nextLinks = links.filter((link) => link.rel === NEXT_LINK_PROP);
    if (nextLinks.length !== 1) return;
    const nextLink = nextLinks.at(0);
    if (nextLink) {
        return nextLink.href;
    }
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

export const _queryAllFeatures = async (
    allUrls: Array<string>,
    featureFormat: FeatureFormat,
    signal: AbortSignal,
    addFeatures: (features: Array<Feature<Geometry>>) => void,
    queryFeatures = _queryFeatures
): Promise<FeatureResponse> => {
    const allFeatureResponse: FeatureResponse = {
        nextURL: undefined,
        features: []
    };
    const allRequestPromises = allUrls.map(async (singleUrl, index): Promise<FeatureResponse> => {
        const isLast = index === allUrls.length - 1;
        const singleFeatureResp = await queryFeatures(singleUrl, featureFormat, signal);
        logger.debug(
            `NextURL for index = ${index} (isLast = ${isLast}): ${
                singleFeatureResp.nextURL || "No Next URL"
            }`
        );
        const features = singleFeatureResp.features as Array<Feature>;
        addFeatures(features);
        allFeatureResponse.features = allFeatureResponse.features.concat(features);
        if (isLast) allFeatureResponse.nextURL = singleFeatureResp.nextURL;
    });
    await Promise.all(allRequestPromises);
    return allFeatureResponse;
};

export const _queryAllFeaturesNextStrategy = async (
    fullURL: string,
    limit: number,
    featureFormat: FeatureFormat,
    queryFeatures: (
        fullURL: string,
        featureFormat: FeatureFormat | undefined,
        signal: AbortSignal
    ) => Promise<FeatureResponse>,
    signal: AbortSignal,
    addFeatures: (features: Array<Feature<Geometry>>) => void
): Promise<Array<Feature>> => {
    let urls: Array<string> = [`${fullURL}&limit=${limit}`];
    let allFeatures: Array<Feature> = [];
    let featureResp: FeatureResponse;
    do {
        featureResp = await _queryAllFeatures(
            urls,
            featureFormat,
            signal,
            addFeatures,
            queryFeatures
        );
        allFeatures = allFeatures.concat(featureResp.features);
        urls = [featureResp.nextURL || ""];
    } while (featureResp.nextURL !== undefined);
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
    const isOffsetSupported = isOffsetStrategySupported(collectionItemsURL);
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

        const addFeaturesFunc =
            addFeatures ||
            function (features: Array<Feature<Geometry>>) {
                logger.info(`Adding ${features.length} features`);
                vectorSrc.addFeatures(features);
            };

        const catchFunc = (e): void => {
            if (e.name !== "AbortError") {
                logger.error(e);
            } else {
                logger.debug("Query-Feature-Request aborted", e);
                vectorSrc.removeLoadedExtent(extent);
                failure && failure();
            }
        };

        const successFunc = (features: Array<Feature>): void => {
            success && success(features);
            logger.debug("Finished loading features for extent:", extent);
        };

        if (!isOffsetSupported) {
            _queryAllFeaturesWithOffset(
                fullURL,
                vectorSrc.getFormat(),
                queryFeatures,
                abortController.signal,
                addFeaturesFunc,
                options.offsetRequestProps
            )
                .then(successFunc)
                .catch(catchFunc);
        } else {
            _queryAllFeaturesNextStrategy(
                fullURL,
                options.nextRequestProps?.limit || defaultNextRequestProps.limit,
                vectorSrc.getFormat(),
                queryFeatures,
                abortController.signal,
                addFeaturesFunc
            )
                .then(successFunc)
                .catch(catchFunc);
        }
    };
    vectorSrc.setLoader(loaderFunction);
    return vectorSrc;
}

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
