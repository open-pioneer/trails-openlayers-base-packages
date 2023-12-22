// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";

const LOG = createLogger("map:WMTSLayer");

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getLegendUrl(
    capabilities: Record<string, any>,
    activeLayerId: string | undefined,
    activeStyleId: string | undefined
): string | undefined {
    const content = capabilities?.Contents;
    const layers = content?.Layer;

    let activeLayer = layers?.find((layer: any) => layer?.Identifier === activeLayerId);
    if (!activeLayer) {
        LOG.debug("Failed to find the active layer in WMTS layer capabilities.");
        activeLayer = layers?.[0];
        if (!activeLayer) {
            LOG.debug("No layer in WMTS capabilities - giving up.");
            return undefined;
        }
    }

    const styles = activeLayer.Style;
    let activeStyle = styles?.find((style: any) => style?.Identifier === activeStyleId);
    if (!activeStyle) {
        LOG.debug("Failed to find active style in WMTS layer.");
        activeStyle = styles?.[0];
        if (!activeStyle) {
            LOG.debug("No style in WMTS layer capabilities - giving up.");
            return undefined;
        }
    }

    const legendUrl = activeStyle.LegendURL?.[0]?.href;
    return legendUrl as string | undefined;
}

export async function fetchCapabilities(
    url: string,
    httpService: HttpService,
    signal: AbortSignal
): Promise<string> {
    const response = await httpService.fetch(url, { signal });
    if (!response.ok) {
        throw new Error("Request failed: " + response.status);
    }
    const result = await response.text();
    return result;
}
