// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { Toc } from "./Toc";
import userEvent from "@testing-library/user-event";
import { GroupLayerImpl } from "@open-pioneer/map/model/layers/GroupLayerImpl";
import { SimpleLayerImpl } from "@open-pioneer/map/model/layers/SimpleLayerImpl";

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

    const toolsMenu = await findMenu();
    expect(toolsMenu).toMatchSnapshot();
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

    const itemButton = await screen.findByLabelText("tools.hideAllLayers");
    expect(itemButton.tagName).toBe("BUTTON");

    expect(operationalLayers.length).toBe(2);
    expect(operationalLayers[0]?.visible).toBe(true);
    expect(operationalLayers[1]?.visible).toBe(true);

    await userEvent.click(itemButton);

    expect(operationalLayers[0]?.visible).toBe(false);
    expect(operationalLayers[1]?.visible).toBe(false);
});

it("Should collapse all layer items in toc", async () => {
    const olLayer1 = new TileLayer({});
    const olLayer2 = new TileLayer({});
    const grouplayer = new GroupLayerImpl({
        id: "group",
        title: "group test",
        layers: [
            new SimpleLayerImpl({
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            new GroupLayerImpl({
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    new SimpleLayerImpl({
                        id: "subgroupmember",
                        title: "subgroup member",
                        olLayer: olLayer2
                    })
                ]
            })
        ]
    });

    const { mapId, registry } = await setupMap({
        layers: [grouplayer]
    });
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc
                mapId={mapId}
                data-testid="toc"
                showTools={true}
                collapsibleGroups={true}
                toolsConfig={{ showCollapseAllGroups: true }}
            />
        </PackageContextProvider>
    );

    const { tocDiv } = await findTools();

    const collapsibles = tocDiv.querySelectorAll(".toc-collapsible-item");
    for (const collapsible of collapsibles) {
        expect(collapsible.getAttribute("style")?.includes("height: auto;"));
    }

    const collapseAllButton = await screen.findByLabelText("tools.collapseAllGroups");
    expect(collapseAllButton.tagName).toBe("BUTTON");
    await userEvent.click(collapseAllButton);
    //collapse sets heigth to 0
    for (const collapsible of collapsibles) {
        expect(collapsible.getAttribute("style")?.includes("height: 0"));
    }
});

it("Should not display collapse all button", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "SimpleLayer 1",
                id: "simplelayer-1",
                olLayer: new TileLayer({})
            }
        ]
    });
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc
                mapId={mapId}
                data-testid="toc"
                showTools={true}
                collapsibleGroups={true}
                toolsConfig={{ showCollapseAllGroups: false }}
            />
        </PackageContextProvider>
    );

    await findTools();

    const collapseAllButton = await screen.queryByLabelText("tools.collapseAllGroups");
    expect(collapseAllButton).toBeNull();
});

async function findTools() {
    const tocDiv = await screen.findByTestId("toc");
    const tools = await waitFor(() => {
        const tools = tocDiv.querySelector(".toc-tools");
        if (!tools) {
            throw new Error("tools container not found");
        }
        return tools;
    });
    return { tools, tocDiv };
}

async function findMenu() {
    const menu = await waitFor(() => {
        const menu = document.querySelector(".tools-menu");
        if (!menu) {
            throw new Error("Menu not found");
        }
        return menu;
    });
    return menu;
}
