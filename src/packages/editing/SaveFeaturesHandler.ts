// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { HttpService } from "@open-pioneer/http";
import { GeoJSONGeometry } from "ol/format/GeoJSON";

export async function saveCreatedFeature(
    httpService: HttpService,
    url: string,
    geometry: GeoJSONGeometry
) {
    const crs = "http://www.opengis.net/def/crs/EPSG/0/25832"; // todo
    const response = await httpService.fetch(url, {
        method: "POST",
        body: JSON.stringify({ type: "Feature", properties: {}, geometry: geometry }),
        headers: {
            "Content-Type": "application/geo+json; charset=utf-8",
            "Content-Crs": `<${crs}>`
        }
    });
    if (!response || !response.ok) {
        throw new Error("Request failed: " + response.status);
    }
    console.log(response);
    console.log(
        // @ts-expect-error sdf
        response.headers
            .get("location")
            // @ts-expect-error sdf
            .substr(response.headers.get("location").lastIndexOf("/") + 1)
    );
}
