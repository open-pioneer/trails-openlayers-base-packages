// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { nextTick } from "@conterra/reactivity-core";
import { GroupLayer, SimpleLayer } from "@open-pioneer/map";
import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import {
    fireEvent,
    queryAllByRole,
    queryByRole,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LayerGroup from "ol/layer/Group";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { act, ReactNode } from "react";
import { expect, it } from "vitest";
import { TocModel, TocModelProvider, TocWidgetOptions } from "../../model/TocModel";
import { TopLevelLayerList } from "./LayerList";

it("should show layers in the correct order", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                olLayer: new TileLayer({})
            },
            {
                title: "Layer 2",
                olLayer: new TileLayer({})
            },
            {
                title: "Layer 3",
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    /*
       Layers are configured from bottom to top, but the TOC lists
       them from top to bottom!
     */
    const labels = getCurrentLabels(container);
    expect(labels).toMatchInlineSnapshot(`
      [
        "Layer 3",
        "Layer 2",
        "Layer 1",
      ]
    `);
});

it("does not display base layers", async function () {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                olLayer: new TileLayer({})
            },
            {
                title: "Layer 2",
                isBaseLayer: true,
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const labels = getCurrentLabels(container);
    expect(labels).toEqual(["Layer 1"]);
});

it("shows a single entry for layer groups inside a SimpleLayer", async function () {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                olLayer: new TileLayer({})
            },
            {
                title: "Layer 2",
                olLayer: new LayerGroup({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const labels = getCurrentLabels(container);
    expect(labels).toEqual(["Layer 2", "Layer 1"]);
});

it("shows a fallback message if there are no layers", async function () {
    const { mapId, registry } = await setupMap({
        layers: []
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    expect(container.textContent).toBe("missingLayers");
});

it("reacts to changes in the layer composition", async function () {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const initialItems = getCurrentItems(container);
    expect(initialItems).toHaveLength(1);

    await act(async () => {
        map.layers.addLayer(
            new SimpleLayer({
                title: "Layer 2",
                olLayer: new TileLayer({})
            })
        );
        await nextTick();
    });

    const itemsAfterChange = getCurrentItems(container);
    expect(itemsAfterChange).toHaveLength(2);

    const labels = getCurrentLabels(container);
    expect(labels).toEqual(["Layer 2", "Layer 1"]);
});

it("displays the layer's current title", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "layer",
                title: "Layer 1",
                olLayer: new TileLayer({})
            }
        ]
    });

    const map = await registry.expectMapModel(mapId);
    const layer = map.layers.getLayerById("layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    expect(getCurrentLabels(container)).toEqual(["Layer 1"]);
    await act(async () => {
        layer.setTitle("New title");
        await nextTick();
    });
    expect(getCurrentLabels(container)).toEqual(["New title"]);
});

it("displays the layer's current visibility", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "layer",
                title: "Layer 1",
                olLayer: new TileLayer({})
            }
        ]
    });

    const map = await registry.expectMapModel(mapId);
    const layer = map.layers.getLayerById("layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }
    expect(layer.visible).toBe(true);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox");
    expect(checkbox).toBeTruthy();
    expect(checkbox!.checked).toBe(true);

    await act(async () => {
        layer.setVisible(false);
        await nextTick();
    });
    expect(checkbox!.checked).toBe(false);
});

it("changes the layer's visibility when toggling the checkbox", async () => {
    const user = userEvent.setup();
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "layer",
                title: "Layer 1",
                olLayer: new TileLayer({})
            }
        ]
    });

    const map = await registry.expectMapModel(mapId);
    const layer = map.layers.getLayerById("layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    // Initial state reflects layer state (visible)
    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox")!;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(true);
    expect(layer.visible).toBe(true);

    // Click sets both to false
    await user.click(checkbox);
    expect(checkbox!.checked).toBe(false);
    expect(layer.visible).toBe(false);

    // Clicking again sets it to true again
    await user.click(checkbox);
    expect(checkbox!.checked).toBe(true);
    expect(layer.visible).toBe(true);
});

it("includes the layer id in the item's class list", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "some layer id",
                title: "Layer 1",
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const item = container.querySelector(".layer-some-layer-id");
    expect(item).toBeTruthy();
    expect(item!.textContent).toBe("Layer 1");
});

it("renders buttons for all layer's with description property", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                olLayer: new TileLayer({}),
                description: "Description 1"
            },
            {
                title: "Layer 2",
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const initialItems = queryAllByRole(container, "button");
    expect(initialItems).toHaveLength(1);
});

it("changes the description popover's visibility when toggling the button", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "layer",
                title: "Layer 1",
                olLayer: new TileLayer({}),
                description: "Description 1"
            },
            {
                title: "Layer 2",
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);
    const layer = map.layers.getLayerById("layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const button = queryByRole(container, "button");
    if (!button) {
        throw new Error("description button not found!");
    }

    const description = screen.getByText(layer.description);

    // initially hidden
    expect(description).not.toBeVisible();

    // open the popover
    fireEvent.click(button);
    await waitFor(async () => {
        expect(description).toBeVisible();
    });

    // close the popover again
    fireEvent.click(button);
    await waitFor(async () => {
        expect(description).not.toBeVisible();
    });
});

it("reacts to changes in the layer description", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "layer1",
                title: "Layer 1",
                olLayer: new TileLayer({}),
                description: "Description"
            },
            {
                id: "layer2",
                title: "Layer 2",
                olLayer: new TileLayer({})
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);
    const layer = map.layers.getLayerById("layer1");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const initialItems = queryAllByRole(container, "button");
    expect(initialItems).toHaveLength(1);
    screen.getByText("Description");
    await act(async () => {
        layer.setDescription("New description");
        await nextTick();
    });
    screen.getByText("New description");
});

it("reacts to changes of the layer load state", async () => {
    const source = new OSM();

    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "layer1",
                title: "Layer 1",
                description: "Description 1",
                olLayer: new TileLayer({
                    source: source
                })
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper()
    });

    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox")!;
    const button = queryByRole<HTMLInputElement>(container, "button");
    let icons = container.querySelectorAll(".toc-layer-item-content-icon");

    expect(checkbox).toBeTruthy();
    expect(checkbox.disabled).toBe(false);
    expect(button?.disabled).toBe(false);
    expect(icons).toHaveLength(0);

    await act(async () => {
        source.setState("error");
        await nextTick();
    });

    icons = container.querySelectorAll(".toc-layer-item-content-icon");
    expect(checkbox.disabled).toBe(true);
    expect(button?.disabled).toBe(true);
    expect(icons).toHaveLength(1);

    // and back
    await act(async () => {
        source.setState("ready");
        await nextTick();
    });

    icons = container.querySelectorAll(".toc-layer-item-content-icon");
    expect(checkbox.disabled).toBe(false);
    expect(button?.disabled).toBe(false);
    expect(icons).toHaveLength(0);
});

it("supports a hierarchy of layers", async () => {
    const user = userEvent.setup();

    const { group, subgroup, submember } = createGroupHierarchy();
    const { mapId, registry } = await setupMap({
        layers: [group]
    });

    const map = await registry.expectMapModel(mapId);
    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper({
            autoShowParents: true
        })
    });

    // Check hierarchy of dom elements
    const groupItem = findLayerItem(container, "group")!;
    expect(groupItem).toBeDefined();

    const memberItem = findLayerItem(groupItem!, "member")!;
    expect(memberItem?.tagName).toBeDefined();
    expect(groupItem!.contains(memberItem)).toBe(true);

    const subgroupItem = findLayerItem(groupItem!, "subgroup")!;
    expect(subgroupItem).toBeDefined();
    expect(groupItem!.contains(subgroupItem)).toBe(true);

    const submemberItem = findLayerItem(subgroupItem, "submember")!;
    expect(submemberItem).toBeDefined();
    expect(subgroupItem!.contains(submemberItem)).toBe(true);
    expect(subgroupItem.contains(memberItem)).toBe(false);

    // Make the leaf layer visible, this should show all parents as well.
    const checkbox = queryByRole<HTMLInputElement>(submemberItem, "checkbox")!;
    expect(group.visible).toBe(false);
    expect(subgroup.visible).toBe(false);
    expect(submember.visible).toBe(false);
    await user.click(checkbox);
    await act(async () => {
        await nextTick();
    });
    expect(group.visible).toBe(true);
    expect(subgroup.visible).toBe(true);
    expect(submember.visible).toBe(true);
});

it("supports disabling autoShowParents", async () => {
    const user = userEvent.setup();

    const { group, subgroup, submember } = createGroupHierarchy();
    const { mapId, registry } = await setupMap({
        layers: [group]
    });

    const map = await registry.expectMapModel(mapId);
    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper({
            autoShowParents: false
        })
    });

    const submemberItem = findLayerItem(container, "submember")!;
    expect(submemberItem).toBeDefined();

    const checkbox = queryByRole<HTMLInputElement>(submemberItem, "checkbox")!;
    expect(group.visible).toBe(false);
    expect(subgroup.visible).toBe(false);
    expect(submember.visible).toBe(false);
    await user.click(checkbox);
    await act(async () => {
        await nextTick();
    });

    // only the clicked layer should be visible
    expect(group.visible).toBe(false);
    expect(subgroup.visible).toBe(false);
    expect(submember.visible).toBe(true);
});

it("should collapse and expand list items", async () => {
    const user = userEvent.setup();
    const { group } = createGroupHierarchy();
    const { mapId, registry } = await setupMap({
        layers: [group]
    });

    const map = await registry.expectMapModel(mapId);
    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper({
            collapsibleGroups: true
        })
    });

    const groupItem = findLayerItem(container, "group")!;
    expect(groupItem).toBeDefined();

    const groupCollapseButton = queryAllByRole<HTMLElement>(groupItem, "button")[0]!;
    const collapsibleList = container.getElementsByClassName("toc-collapsible-item").item(0)!;
    expect(groupCollapseButton).toBeDefined();
    expect(groupCollapseButton?.getAttribute("aria-expanded")).toBe("true");
    expect(collapsibleList).toBeDefined();
    expect(collapsibleList.getAttribute("style")?.includes("height: auto")).toBe(true);

    await user.click(groupCollapseButton); //collapse
    expect(groupCollapseButton?.getAttribute("aria-expanded")).toBe("false");
    expect(collapsibleList.getAttribute("style")?.includes("height: 0")).toBe(true);

    await user.click(groupCollapseButton); //expand again
    expect(groupCollapseButton?.getAttribute("aria-expanded")).toBe("true");
    expect(collapsibleList.getAttribute("style")?.includes("height: auto")).toBe(true);
});

it("it renders collapse buttons (only) for groups", async () => {
    const { group } = createGroupHierarchy();
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "SimpleLayer",
                id: "simplelayer",
                olLayer: new TileLayer({})
            },
            group
        ]
    });

    const map = await registry.expectMapModel(mapId);
    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper({ collapsibleGroups: true })
    });

    const groupItem = findLayerItem(container, "group")!;
    expect(groupItem).toBeDefined();
    const subGroupItem = findLayerItem(container, "subgroup")!;
    expect(subGroupItem).toBeDefined();
    const nongroupItem = findLayerItem(container, "simplelayer")!;
    expect(nongroupItem).toBeDefined();

    const groupCollapseButton = queryAllByRole<HTMLElement>(groupItem, "button")[0];
    expect(groupCollapseButton).toBeDefined();
    const subgroupCollapseButton = queryAllByRole<HTMLElement>(subGroupItem, "button")[0];
    expect(subgroupCollapseButton).toBeDefined();
    const nongroupCollapseButton = queryAllByRole<HTMLElement>(nongroupItem, "button");
    expect(nongroupCollapseButton.length).toBe(0); //has no child layers -> should not render collapse button
});

it("supports disabling collapsibleGroups, even if `initiallyCollapsed` is `true`", async () => {
    const { group } = createGroupHierarchy();
    const { mapId, registry } = await setupMap({
        layers: [group]
    });

    const map = await registry.expectMapModel(mapId);
    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper({
            collapsibleGroups: false,
            initiallyCollapsed: true
        })
    });

    const groupItem = findLayerItem(container, "group")!;
    expect(groupItem).toBeDefined();
    const subGroupItem = findLayerItem(container, "subgroup")!;
    expect(subGroupItem).toBeDefined();

    const groupCollapseButton = queryAllByRole<HTMLElement>(groupItem, "button")[0];
    expect(groupCollapseButton).toBeUndefined();
    const subgroupCollapseButton = queryAllByRole<HTMLElement>(subGroupItem, "button")[0];
    expect(subgroupCollapseButton).toBeUndefined();
});

it("supports initial collapsed groups", async () => {
    const user = userEvent.setup();
    const { group } = createGroupHierarchy();
    const { mapId, registry } = await setupMap({
        layers: [group]
    });

    const map = await registry.expectMapModel(mapId);
    const { container } = render(<TopLevelLayerList map={map} />, {
        wrapper: createWrapper({
            collapsibleGroups: true,
            initiallyCollapsed: true
        })
    });

    const groupItem = findLayerItem(container, "group")!;
    expect(groupItem).toBeDefined();

    const groupCollapseButton = queryAllByRole<HTMLElement>(groupItem, "button")[0]!;
    const collapsibleList = container.getElementsByClassName("toc-collapsible-item").item(0)!;
    expect(groupCollapseButton).toBeDefined();
    expect(groupCollapseButton?.getAttribute("aria-expanded")).toBe("false");
    expect(collapsibleList).toBeDefined();
    expect(collapsibleList.getAttribute("style")?.includes("height: 0")).toBe(true);

    await user.click(groupCollapseButton); //expand
    expect(groupCollapseButton?.getAttribute("aria-expanded")).toBe("true");
    expect(collapsibleList.getAttribute("style")?.includes("height: auto")).toBe(true);
});

/** Returns the layer list's current list items. */
function getCurrentItems(container: HTMLElement) {
    return queryAllByRole(container, "listitem");
}

/** Returns only the labels of the layer list's current items. */
function getCurrentLabels(container: HTMLElement) {
    return getCurrentItems(container).map((item) => item.textContent);
}

function findLayerItem(container: HTMLElement, id: string) {
    return container.querySelector(`li.toc-layer-item.layer-${id}`) as HTMLElement | null;
}

function createGroupHierarchy() {
    const o1 = new TileLayer({});
    const o2 = new TileLayer({});
    const submember = new SimpleLayer({
        id: "submember",
        title: "subgroup member",
        olLayer: o2,
        visible: false
    });
    const subgroup = new GroupLayer({
        id: "subgroup",
        title: "a nested group layer",
        visible: false,
        layers: [submember]
    });
    const group = new GroupLayer({
        id: "group",
        title: "a group layer",
        visible: false,
        layers: [
            new SimpleLayer({
                id: "member",
                title: "group member",
                olLayer: o1,
                visible: false
            }),
            subgroup
        ]
    });
    return { group, subgroup, submember };
}

function createWrapper(options?: Partial<TocWidgetOptions>) {
    const testModel: TocModel = {
        options: {
            autoShowParents: true,
            collapsibleGroups: false,
            initiallyCollapsed: false,
            ...options
        },
        getItem: () => undefined,
        getItems: () => [],
        registerItem: () => undefined,
        unregisterItem: () => undefined
    };
    return function Wrapper(props: { children: ReactNode }) {
        return (
            <PackageContextProvider>
                <TocModelProvider value={testModel}>{props.children}</TocModelProvider>
            </PackageContextProvider>
        );
    };
}
