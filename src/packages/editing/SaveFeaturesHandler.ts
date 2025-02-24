// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import GeoJSONGeometry from "ol/format/GeoJSON";
import GeoJSONGeometryCollection from "ol/format/GeoJSON";
import { Projection } from "ol/proj";

/**
 * Function to save a created feature to an OGC API Features service.
 * Resolves with feature id, or rejects if an error occurs.
 */
export async function saveCreatedFeature(
    httpService: HttpService,
    url: URL,
    geometry: GeoJSONGeometry | GeoJSONGeometryCollection,
    projection: Projection
) {
    const epsgCode = projection.getCode();
    const crs = epsgCode.replace("EPSG:", "http://www.opengis.net/def/crs/EPSG/0/");
    const response = await httpService.fetch(url, {
        method: "POST",
        body: JSON.stringify({ type: "Feature", properties: {}, geometry: geometry }),
        headers: {
            "Content-Type": "application/geo+json; charset=utf-8",
            "Content-Crs": `<${crs}>`
        }
    });

    if (!response || !response.ok || response.status !== 201) {
        throw new Error("Request failed: " + response.status);
    }

    const location = response.headers.get("location");
    if (!location) {
        throw new Error("Request failed: no Location response header");
    }

    const featureId = location.substring(location.lastIndexOf("/") + 1);
    return Promise.resolve(featureId);
}

/**
 * Function to save an updated geometry to a feature to an OGC API Features service.
 * Resolves with feature id, or rejects if an error occurs.
 */
export async function saveUpdatedFeature(
    httpService: HttpService,
    url: URL,
    featureId: string,
    geometry: GeoJSONGeometry | GeoJSONGeometryCollection,
    projection: Projection
) {
    const epsgCode = projection.getCode();
    const crs = epsgCode.replace("EPSG:", "http://www.opengis.net/def/crs/EPSG/0/");
    const featureUrl = new URL(`${url.toString()}/${featureId}`);
    const response = await httpService.fetch(featureUrl, {
        method: "PATCH",
        body: JSON.stringify({ type: "Feature", properties: {}, geometry: geometry }),
        headers: {
            "Content-Type": "application/geo+json; charset=utf-8",
            "Content-Crs": `<${crs}>`
        }
    });

    if (!response || !response.ok || response.status !== 204) {
        throw new Error("Request failed: " + response.status);
    }

    return Promise.resolve(featureId);
}
