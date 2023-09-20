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

const NO_FEATURE_LIMIT = 1000000;
const logger = createLogger("map.layers.OgcFeatureSourceFactory");

/**
 * This function creates an ol-VectorSource for OGC-API-Feature-Services to be used inside
 * an ol-VectorLayer
 * @param ogcFeatureApiBaseUrl: The base-URL right to the "/collections"-part
 * @param collectionId: The collection-ID
 * @param crs: the URL to the EPSG-Code, e.g. "http://www.opengis.net/def/crs/EPSG/0/25832
 * @param attributions: default ol-VectorSource-Property
 * @param featureLimit: default ol-VectorSource-Property
 */
export function createVectorSource(
    ogcFeatureApiBaseUrl: string,
    collectionId: string,
    crs: string = "http://www.opengis.net/def/crs/EPSG/0/25832",
    attributions: string = "",
    featureLimit: number = NO_FEATURE_LIMIT
): VectorSource {
    const collectionItemsURL = `${ogcFeatureApiBaseUrl}/collections/${collectionId}/items?`;
    const vectorSrc = new VectorSource({
        format: new GeoJSON(),
        strategy: bbox,
        attributions: attributions
    });
    const loaderFunction = async (
        extent: Extent,
        resolution: number,
        __: unknown,
        ___: unknown,
        ____: unknown
    ): Promise<void> => {
        logger.info(`resolution: ${resolution}`);
        logger.info(`extent: ${extent}`);
        logger.info(`slitted extent count: ${bbox(extent, resolution).length}`);
        const fullURL = `${collectionItemsURL}limit=${featureLimit}&bbox=${extent.join(
            ","
        )}&bbox-crs=${crs}&crs=${crs}&f=json`;
        const features = (await queryFeatures(fullURL, vectorSrc)) as Array<Feature<Geometry>>;
        vectorSrc.addFeatures(features);
    };
    vectorSrc.setLoader(loaderFunction);
    return vectorSrc;
}

const queryFeatures = async (
    fullURL: string,
    vectorSrc: VectorSource
): Promise<Array<FeatureLike>> => {
    let featureArr = new Array<FeatureLike>();
    try {
        const response = await fetch(fullURL, {
            headers: {
                Accept: "application/geo+json"
            }
        });
        if (response.status !== 200) {
            logger.error(`Request failed with status ${response.status}:`, response);
            return featureArr;
        }
        const getFormat = vectorSrc.getFormat();
        if (getFormat) {
            const geoJson = await response.json();
            featureArr = getFormat.readFeatures(geoJson);
        }
    } catch (err) {
        // TODO: Remove when API improved to accept more parameter types
        logger.error(err as Error);
    }
    return featureArr;
};
