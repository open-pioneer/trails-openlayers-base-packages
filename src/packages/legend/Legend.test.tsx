// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import TileLayer from "ol/layer/Tile";
import { render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Legend } from "./Legend";

const LEGEND_ITEM_CLASS = ".legend-item";

it("should successfully create a legend component", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: new TileLayer({}),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({})
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: new TileLayer({})
            }
        ]
    });
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    expect(legendDiv).toMatchSnapshot();
});

it("should successfully show legend for imageUrl configuration", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: new TileLayer({}),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: new TileLayer({})
            }
        ]
    });
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    expect(legendDiv).toMatchSnapshot();
});

async function findLegend() {
    const legendDiv = await screen.findByTestId("legend");
    return legendDiv;
}

async function waitForLegendItem(legendDiv: HTMLElement) {
    return await waitFor(() => {
        const legendItem = legendDiv.querySelector(LEGEND_ITEM_CLASS);
        if (!legendItem) {
            throw new Error("basemap switcher not mounted");
        }

        return legendItem;
    });
}
