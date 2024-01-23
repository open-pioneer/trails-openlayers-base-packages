// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

/**
 * Object to represent attribute information in Table
 */
export interface ResultColumn {
    attributeName: string;
    displayName?: string;
    width?: number;
}
export interface ResultListInput {
    data: BaseFeature[];
    metadata: ResultColumn[];
}
