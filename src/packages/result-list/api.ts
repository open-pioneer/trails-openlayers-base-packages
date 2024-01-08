// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Feature } from "ol";

/**
 * Object to collect all attribute information for all features with styling informationen
 */
export interface ResultData {
    features: Feature[];
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
