// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { Toc } from "./Toc";
import userEvent from "@testing-library/user-event";

it("Should successfully create a toc with default tool component", async () => {
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
            }
        ]
    });
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc mapId={mapId} data-testid="toc" showTools={true} />
        </PackageContextProvider>
    );

    const toolsDiv = await findTools();
    expect(toolsDiv).toMatchSnapshot();
});

it("Should successfully hide all layers in toc", async () => {
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
    const map = await registry.expectMapModel(mapId);
    const operationalLayers = map.layers.getOperationalLayers();
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc mapId={mapId} data-testid="toc" showTools={true} />
        </PackageContextProvider>
    );

    await findTools();

    const itemButton = await screen.findByLabelText("hideAllLayers");
    expect(itemButton.tagName).toBe("BUTTON");

    expect(operationalLayers.length).toBe(2);
    expect(operationalLayers[0]?.visible).toBe(true);
    expect(operationalLayers[1]?.visible).toBe(true);

    await userEvent.click(itemButton);

    expect(operationalLayers[0]?.visible).toBe(false);
    expect(operationalLayers[1]?.visible).toBe(false);
});

async function findTools() {
    const tocDiv = await screen.findByTestId("toc");
    return tocDiv.querySelector(".tools");
}
