// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, act, render, screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { Toc } from "./Toc";
import userEvent from "@testing-library/user-event";
import { GroupLayerImpl } from "@open-pioneer/map/model/layers/GroupLayerImpl";
import { SimpleLayerImpl } from "@open-pioneer/map/model/layers/SimpleLayerImpl";

it("Should successfully create a toc with default tool component", async () => {
    const { map } = await setupMap({
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

    render(
        <PackageContextProvider>
            <Toc map={map} data-testid="toc" showTools={true} showBasemapSwitcher={false} />
        </PackageContextProvider>
    );

    const toolsDiv = await findTools();
    expect(toolsDiv).toMatchSnapshot();

    const toolsMenu = await findMenu(toolsDiv.tools);
    expect(toolsMenu).toMatchSnapshot();
});

it("Should successfully hide all layers in toc", async () => {
    const { map } = await setupMap({
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
    const operationalLayers = map.layers.getOperationalLayers();

    render(
        <PackageContextProvider>
            <Toc map={map} data-testid="toc" showTools={true} />
        </PackageContextProvider>
    );

    const { tools } = await findTools();

    const hideAllMenuItem = await waitFor(() => {
        const toolsOpenButton = tools.querySelector(".toc-tools-button");
        if (!toolsOpenButton) {
            throw Error("unable to find tools button in toc");
        }
        //trigger menu because of lazy mounting
        act(() => {
            fireEvent.click(toolsOpenButton);
        });

        return screen.findByLabelText("tools.hideAllLayers");
    });

    expect(hideAllMenuItem.tagName).toBe("DIV"); //menu item is a div not a button

    expect(operationalLayers.length).toBe(2);
    expect(operationalLayers[0]?.visible).toBe(true);
    expect(operationalLayers[1]?.visible).toBe(true);

    await userEvent.click(hideAllMenuItem);

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

    const { map } = await setupMap({
        layers: [grouplayer]
    });

    render(
        <PackageContextProvider>
            <Toc
                map={map}
                data-testid="toc"
                showTools={true}
                collapsibleGroups={true}
                initiallyCollapsed={false}
                toolsConfig={{ showCollapseAllGroups: true }}
            />
        </PackageContextProvider>
    );

    const { tocDiv, tools } = await findTools();

    const collapsibles = tocDiv.querySelectorAll(".toc-collapsible-item");
    for (const collapsible of collapsibles) {
        expect(collapsible.getAttribute("data-state")).toBe("open");
    }

    const collapseAllMenuItem = await waitFor(() => {
        const toolsOpenButton = tools.querySelector(".toc-tools-button");
        if (!toolsOpenButton) {
            throw Error("unable to find tools button in toc");
        }
        //trigger menu because of lazy mounting
        act(() => {
            fireEvent.click(toolsOpenButton);
        });

        return screen.findByLabelText("tools.collapseAllGroups");
    });

    expect(collapseAllMenuItem.tagName).toBe("DIV"); //menu item is a div not a button
    await userEvent.click(collapseAllMenuItem);
    for (const collapsible of collapsibles) {
        expect(collapsible.getAttribute("data-state")).toBe("closed");
    }
});

it("Should not display collapse all button", async () => {
    const { map } = await setupMap({
        layers: [
            {
                title: "SimpleLayer 1",
                id: "simplelayer-1",
                olLayer: new TileLayer({})
            }
        ]
    });

    render(
        <PackageContextProvider>
            <Toc
                map={map}
                data-testid="toc"
                showTools={true}
                collapsibleGroups={true}
                initiallyCollapsed={false}
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

async function findMenu(tools: Element) {
    const menu = await waitFor(() => {
        const toolsOpenButton = tools.querySelector(".toc-tools-button");
        if (!toolsOpenButton) {
            throw Error("unable to find tools button in toc");
        }
        //trigger menu because of lazy mounting
        act(() => {
            fireEvent.click(toolsOpenButton);
        });

        const menu = document.querySelector(".toc-tools-menu");
        if (!menu) {
            throw new Error("Menu not found");
        }
        return menu;
    });
    return menu;
}
