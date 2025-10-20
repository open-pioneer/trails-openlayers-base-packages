// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Extent, getHeight, getWidth } from "ol/extent";

const DEFAULT_BUFFER_FACTOR = 1.2;

/**
 * Computes a buffered extent using the given original extent.
 *
 * Use the `factor` (`1.2` by default) to specify the size increase.
 *
 * @group Utilities
 */
export function calculateBufferedExtent(extent: Extent, factor = DEFAULT_BUFFER_FACTOR): Extent {
    checkExtent(extent);
    const width = getHeight(extent);
    const height = getWidth(extent);
    const bufferWidth = width * factor;
    const bufferHeight = height * factor;
    const bufferedExtent = [
        extent[0] - (bufferWidth - width) / 2,
        extent[1] - (bufferHeight - height) / 2,
        extent[2] + (bufferWidth - width) / 2,
        extent[3] + (bufferHeight - height) / 2
    ];
    return bufferedExtent;
}

function checkExtent(extent: Extent): asserts extent is [number, number, number, number] {
    if (extent.length !== 4) {
        throw new Error(`Invalid extent (expected length 4, but got length ${extent.length}).`);
    }
}
