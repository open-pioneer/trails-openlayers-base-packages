// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { bbox } from "ol/loadingstrategy";
import { Extent } from "ol/extent";
import { createLogger } from "@open-pioneer/core";
import { FeatureLike } from "ol/Feature";
import { Geometry } from "ol/geom";
import { Feature } from "ol";

const NEXT_LINK_PROP = "next";
const logger = createLogger("ogc-feature-api-layer:OgcFeatureSourceFactory");

interface FeatureResponse {
    features: Array<FeatureLike>;
    nextURL: string | undefined;
}

type OffsetRequestProps = {
    numberOfConcurrentReq: number; //10
    offsetDelta: number; //5000
    startOffset: number; //0
};

// Chrome does only allow 6 concurrent requests
const defaultOffsetRequestProps: OffsetRequestProps = {
    numberOfConcurrentReq: 6,
    offsetDelta: 2500,
    startOffset: 0
};

function getNextURL(
    links: HTMLCollectionOf<HTMLAnchorElement | HTMLAreaElement>
): string | undefined {
    const nextLinks = Array.from(links).filter((link) => link.rel === NEXT_LINK_PROP);
    const nextLink = nextLinks.at(0);
    if (nextLink) {
        return nextLink.href;
    }
}

function createOffsetURLs(
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

const queryFeaturesFunc = async (
    fullURL: string,
    vectorSrc: VectorSource,
    abortController: AbortController = new AbortController()
): Promise<FeatureResponse> => {
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
        const getFormat = vectorSrc.getFormat();
        if (getFormat) {
            const geoJson = await response.json();
            featureArr = getFormat.readFeatures(geoJson);
            nextURL = getNextURL(geoJson.links);
        }
    } catch (e: unknown) {
        logger.debug("Query-Feature-Request aborted", e);
    }
    return {
        features: featureArr,
        nextURL: nextURL
    };
};

const queryAllFeatures = async (
    fullURL: string,
    vectorSrc: VectorSource,
    abortController: AbortController = new AbortController(),
    queryFeature = queryFeaturesFunc,
    offsetProps: OffsetRequestProps = defaultOffsetRequestProps
) => {
    let noMoreNextURLs = false;
    // eslint-disable-next-line prefer-const
    let { numberOfConcurrentReq, startOffset, offsetDelta } = offsetProps;
    do {
        const allRequests = createOffsetURLs(
            fullURL,
            numberOfConcurrentReq,
            startOffset,
            offsetDelta
        );
        const allRequestPromises = allRequests.map(async (singleRequest, index) => {
            const isLast = index === allRequests.length - 1;
            const featureResp = await queryFeature(singleRequest, vectorSrc, abortController);
            logger.debug(
                `NextURL for index = ${index} (isLast = ${isLast}): ${
                    featureResp.nextURL || "No Next URL"
                }`
            );
            const features = featureResp.features as Array<Feature<Geometry>>;
            vectorSrc.addFeatures(features);
            if (isLast) noMoreNextURLs = featureResp.nextURL == undefined;
        });
        await Promise.all(allRequestPromises);
        startOffset += numberOfConcurrentReq * offsetDelta;
    } while (!noMoreNextURLs);
};

/**
 * This function creates an ol-VectorSource for OGC-API-Feature-Services to be used inside
 * an ol-VectorLayer
 * @param ogcFeatureApiBaseUrl: The base-URL right to the "/collections"-part
 * @param collectionId: The collection-ID
 * @param crs: the URL to the EPSG-Code, e.g. "http://www.opengis.net/def/crs/EPSG/0/25832
 * @param attributions: default ol-VectorSource-Property
 * @param queryFeatures: Function to query Features
 */
export function createVectorSource(
    ogcFeatureApiBaseUrl: string,
    collectionId: string,
    crs: string = "http://www.opengis.net/def/crs/EPSG/0/25832",
    attributions: string = "",
    queryFeatures = queryFeaturesFunc
): VectorSource {
    const collectionItemsURL = `${ogcFeatureApiBaseUrl}/collections/${collectionId}/items?`;
    const vectorSrc = new VectorSource({
        format: new GeoJSON(),
        strategy: bbox,
        attributions: attributions
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
        queryAllFeatures(fullURL, vectorSrc, abortController, queryFeatures).then(() => {
            logger.debug("Finished loading features for extent:", extent);
        });
    };
    vectorSrc.setLoader(loaderFunction);
    return vectorSrc;
}
