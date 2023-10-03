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

const NEXT_LINK_PROP = "next";
const logger = createLogger("ogc-feature-api-layer:OgcFeatureSourceFactory");

export interface _FeatureResponse {
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

export interface _ObjWithRelAndHref {
    href: string;
    rel: string;
}

export function _getNextURL(links: Array<_ObjWithRelAndHref>): string | undefined {
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
    abortController: AbortController = new AbortController()
): Promise<_FeatureResponse> => {
    let featureArr = new Array<FeatureLike>();
    let nextURL;

    const signal = abortController.signal;
    try {
        const response = await fetch(fullURL, {
            headers: {
                Accept: "application/geo+json"
            },
            signal
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
        nextURL = _getNextURL(Array.from(geoJson.links));
    } catch (e: unknown) {
        logger.debug("Query-Feature-Request aborted", e);
    }
    return {
        features: featureArr,
        nextURL: nextURL
    };
};

export const _queryAllFeatureRequests = async (
    fullURL: string,
    featureFormat: FeatureFormat | undefined,
    abortController: AbortController = new AbortController(),
    queryFeatures = _queryFeatures,
    addFeatures: (features: Array<Feature<Geometry>>) => void,
    offsetProps: OffsetRequestProps = defaultOffsetRequestProps
) => {
    let noMoreNextURLs = false;
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
            const featureResp = await queryFeatures(singleRequest, featureFormat, abortController);
            logger.debug(
                `NextURL for index = ${index} (isLast = ${isLast}): ${
                    featureResp.nextURL || "No Next URL"
                }`
            );
            const features = featureResp.features as Array<Feature<Geometry>>;
            addFeatures(features);
            if (isLast) noMoreNextURLs = featureResp.nextURL == undefined;
        });
        await Promise.all(allRequestPromises);
        startOffset += numberOfConcurrentReq * offsetDelta;
    } while (!noMoreNextURLs);
};

export function _createVectorSource(
    ogcFeatureApiBaseUrl: string,
    collectionId: string,
    crs: string = "http://www.opengis.net/def/crs/EPSG/0/25832",
    attributions: string = "",
    additionalOptions: Options<Geometry> = {},
    queryFeatures = _queryFeatures,
    offsetProps: OffsetRequestProps = defaultOffsetRequestProps,
    addFeatures: ((features: Array<Feature<Geometry>>) => void) | undefined
): VectorSource {
    const collectionItemsURL = `${ogcFeatureApiBaseUrl}/collections/${collectionId}/items?`;
    const vectorSrc = new VectorSource({
        format: new GeoJSON(),
        strategy: bbox,
        attributions: attributions,
        ...additionalOptions
    });
    let abortController: AbortController;
    const loaderFunction = async (
        extent: Extent,
        _: number,
        __: unknown,
        ___: unknown,
        ____: unknown
    ): Promise<void> => {
        const fullURL = `${collectionItemsURL}bbox=${extent.join(
            ","
        )}&bbox-crs=${crs}&crs=${crs}&f=json`;
        if (abortController) {
            abortController.abort("Extent changed");
        }
        abortController = new AbortController();
        const addFeaturesFunc =
            addFeatures ||
            function (features: Array<Feature<Geometry>>) {
                vectorSrc.addFeatures(features);
            };
        _queryAllFeatureRequests(
            fullURL,
            vectorSrc.getFormat(),
            abortController,
            queryFeatures,
            addFeaturesFunc,
            offsetProps
        ).then(() => {
            logger.debug("Finished loading features for extent:", extent);
        });
    };
    vectorSrc.setLoader(loaderFunction);
    return vectorSrc;
}

/**
 * This function creates an ol-VectorSource for OGC-API-Feature-Services to be used inside
 * an ol-VectorLayer
 * @param ogcFeatureApiBaseUrl: The base-URL right to the "/collections"-part
 * @param collectionId: The collection-ID
 * @param crs: the URL to the EPSG-Code, e.g. "http://www.opengis.net/def/crs/EPSG/0/25832
 * @param attributions: default ol-VectorSource-Property
 * @param offsetRequestProps: Optional config values of
 * @param additionalOptions: Optional additional options for the VectorSource
 */
export function createVectorSource(
    ogcFeatureApiBaseUrl: string,
    collectionId: string,
    crs: string = "http://www.opengis.net/def/crs/EPSG/0/25832",
    attributions: string = "",
    offsetRequestProps: OffsetRequestProps = defaultOffsetRequestProps,
    additionalOptions: Options<Geometry> = {}
): VectorSource {
    return _createVectorSource(
        ogcFeatureApiBaseUrl,
        collectionId,
        crs,
        attributions,
        additionalOptions,
        _queryFeatures,
        offsetRequestProps,
        undefined
    );
}
