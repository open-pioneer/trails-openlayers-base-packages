// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import GeoJSONGeometry from "ol/format/GeoJSON";
import GeoJSONGeometryCollection from "ol/format/GeoJSON";
import { Projection } from "ol/proj";

// todo mit in "SaveFeaturesHandler.ts" verschieben?
/**
 * Function to save an updated feature to an OGC API service.
 * Resolves with feature id, or reject if an error occurs.
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
        method: "PUT",
        // Todo: Sicherstellen, dass die Attribute es bisherigen Features nicht ueberschrieben werden
        body: JSON.stringify({ type: "Feature", properties: {}, geometry: geometry }),
        headers: {
            "Content-Type": "application/geo+json; charset=utf-8",
            "Content-Crs": `<${crs}>`
        }
    });

    if (!response || !response.ok || response.status !== 204) {
        return Promise.reject(new Error("Request failed: " + response.status));
    }

    return Promise.resolve(featureId);
}
