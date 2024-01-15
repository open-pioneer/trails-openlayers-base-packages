// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";

export interface ObjectWithAttributsAndGeometry {
    attributes: Record<string, unknown>;
    geometry?: Geometry;
}

/**
 * Object to collect all attribute information for all features with styling informationen
 */
export interface ResultData {
    data: ObjectWithAttributsAndGeometry[];
    metaData?: ResultColumn[];
}

/**
 * Object to represent attribute information in Table
 */
export interface ResultColumn {
    name: string;
    displayName?: string;
    width?: number;
}

export interface ResultListData {
    id: number | string;
    geometry?: Geometry;
    properties?: Readonly<Record<string, unknown>>;
}
