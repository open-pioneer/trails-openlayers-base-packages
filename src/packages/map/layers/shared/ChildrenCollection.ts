// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerRetrievalOptions } from "../../shared";

/**
 * Contains the children of a layer.
 */
export interface ChildrenCollection<LayerType> {
    /**
     * Returns the items in this collection.
     */
    getItems(options?: LayerRetrievalOptions): LayerType[];
}
