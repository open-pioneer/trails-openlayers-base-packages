// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";

const LOG = createLogger("map:WMSLayer:getLegendUrl");

/**
 * Extracts the legend url from the service capabilities.
 **/
export function getLegendUrl(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capabilities: Record<string, any>,
    layerName: string
): string | undefined {
    const capabilitiesContent = capabilities?.Capability;
    const rootLayerCapabilities = capabilitiesContent?.Layer;
    let url: string | undefined = undefined;

    /** Recurse search for the current layer within the parsed capabilities service*/
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchNestedLayer = (layer: Record<string, any>[]) => {
        for (const currentLayer of layer) {
            // spec. if, a layer has a <Name>, then it is a map layer
            if (currentLayer?.Name === layerName) {
                const activeLayer = currentLayer;
                const styles = activeLayer.Style;
                if (!styles || !styles.length) {
                    LOG.debug("No style in WMS layer capabilities - giving up.");
                    return;
                }
                // by parsing of the service capabilities, every child inherits the parent's legend
                // therefore, extract the legendURL from the first style object in the array (its own legend)
                const activeStyle = styles[0];
                url = activeStyle.LegendURL?.[0]?.OnlineResource;
            } else if (currentLayer.Layer) {
                searchNestedLayer(currentLayer.Layer);
            }
        }
    };
    if (rootLayerCapabilities) {
        searchNestedLayer(rootLayerCapabilities.Layer);
    }
    return url;
}
