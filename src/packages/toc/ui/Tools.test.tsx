// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { GroupLayer, SimpleLayer } from "@open-pioneer/map";
import { createTestLayer, createTestOlLayer, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { LayerTocAttributes, Toc } from "./Toc";

it("Should successfully create a toc with default tool component", async () => {
    const { map } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer()
            }
        ],
        mockMapRender: true
    });

    render(
        <PackageContextProvider>
            <Toc map={map} data-testid="toc" showTools={true} showBasemapSwitcher={false} />
        </PackageContextProvider>
    );

    const toolsDiv = await findTools();
    expect(toolsDiv).toMatchSnapshot("find-tools");

    const toolsMenu = await findMenu(toolsDiv.tools);
    expect(toolsMenu).toMatchSnapshot("find-tools-menu");
});

it("Should successfully hide all layers in toc", async () => {
    const { map } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer()
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer()
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

it("Should only hide layers that are shown in the toc", async () => {
    const { map } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer()
            },
            {
                title: "Internal layer",
                id: "internal-layer",
                internal: true,
                olLayer: createTestOlLayer()
            },
            {
                title: "Hidden layer",
                id: "hidden-layer",
                attributes: { toc: { listMode: "hide" } satisfies LayerTocAttributes },
                olLayer: createTestOlLayer()
            },
            createTestLayer({
                type: GroupLayer,
                id: "group",
                title: "Group",
                attributes: { toc: { listMode: "hide-children" } satisfies LayerTocAttributes },
                layers: [
                    createTestLayer({
                        id: "group-member",
                        title: "Group member",
                        olLayer: createTestOlLayer()
                    })
                ]
            })
        ]
    });
    const visibilities = () =>
        Object.fromEntries(
            ["layer-1", "internal-layer", "hidden-layer", "group", "group-member"].map((id) => [
                id,
                map.layers.getLayerById(id)!.visible
            ])
        );

    // All layers are visible at first.
    expect(Object.values(visibilities()).every((v) => v)).toBe(true);

    render(
        <PackageContextProvider>
            <Toc map={map} data-testid="toc" showTools={true} />
        </PackageContextProvider>
    );

    const { tools } = await findTools();
    const menu = await findMenu(tools);
    const hideAllMenuItem = await waitFor(() => screen.findByLabelText("tools.hideAllLayers"));
    expect(menu.contains(hideAllMenuItem)).toBe(true);
    await userEvent.click(hideAllMenuItem);

    // Layers that are not shown in the toc (internal, listMode "hide", children of "hide-children")
    // are not modified by the tool.
    expect(visibilities()).toEqual({
        "layer-1": false,
        "internal-layer": true,
        "hidden-layer": true,
        "group": false,
        "group-member": true
    });
});

it("Should collapse all layer items in toc", async () => {
    const olLayer1 = createTestOlLayer();
    const olLayer2 = createTestOlLayer();
    const grouplayer = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "group test",
        layers: [
            createTestLayer({
                type: SimpleLayer,
                id: "member",
                title: "group member",
                olLayer: olLayer1
            }),
            createTestLayer({
                type: GroupLayer,
                id: "subgroup",
                title: "subgroup test",
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
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
                olLayer: createTestOlLayer()
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
    const toolsOpenButton = await waitFor(() => {
        const toolsOpenButton = tools.querySelector(".toc-tools-button");
        if (!toolsOpenButton) {
            throw Error("unable to find tools button in toc");
        }
        return toolsOpenButton;
    });

    //trigger menu because of lazy mounting
    act(() => {
        fireEvent.click(toolsOpenButton);
    });

    const menu = await waitFor(() => {
        const menu = document.querySelector(".toc-tools-menu");
        if (!menu) {
            throw new Error("Menu not found");
        }
        return menu;
    });
    return menu;
}
