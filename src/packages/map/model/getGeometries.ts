// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";
import { DisplayTarget } from "./MapModel";

export function getGeometries(geoObjects: DisplayTarget[]): Geometry[] {
    const geometries: Geometry[] = [];
    geoObjects.forEach((item) => {
        if ("getType" in item) geometries.push(item);
        if ("geometry" in item && item.geometry) geometries.push(item.geometry);
    });
    return geometries;
}
