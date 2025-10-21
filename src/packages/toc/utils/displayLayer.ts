// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { AnyLayer } from "@open-pioneer/map";
import { LayerTocAttributes } from "../ui/Toc";

/**
 * Checks if a layer should be displayed in the Toc.
 */
export function displayItemForLayer(layer: AnyLayer): boolean {
    const isInternal = layer.internal;
    const listMode = (layer.attributes.toc as LayerTocAttributes | undefined)?.listMode;

    if (listMode === "show" || listMode === "hide-children") {
        return true;
    } else if (isInternal || listMode === "hide") {
        return false;
    } else {
        return true;
    }
}
