// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { BaseFeature } from "@open-pioneer/map/api/BaseFeature";

/**
 * Object to represent attribute information in Table
 */
export interface ResultColumn {
    propertyName: string;
    displayName?: string;
    width?: number;
    getPropertyValue?: (feature: BaseFeature) => string | number | boolean;
}
export interface ResultListInput {
    data: BaseFeature[];
    metadata: ResultColumn[];
}

/** Events emitted by the {@link ResultList}. */
export interface ResultListSelectionChangedEvent {
    action: "changed:selection";
    ids: (number | string)[];
}
