// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { ListRootProps } from "@chakra-ui/react";
import { nextTick, reactiveMap } from "@conterra/reactivity-core";
import { GroupLayer } from "@open-pioneer/map";
import {
    createTestLayer,
    createTestOlLayer,
    LayerConfig,
    setupMap,
    waitForMapRender
} from "@open-pioneer/map-test-utils";
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
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { act, ReactNode } from "react";
import { describe, expect, it, onTestFinished } from "vitest";
import { TocLayerNode } from "../../model/TocLayerNode";
import { SharedData, TocWidgetOptions } from "../../model/TocViewModel";
import { LayerItem } from "./LayerItem";

const PROBLEM_INDICATOR_SELECTOR = ".toc-layer-item-problem-indicator svg";

it("displays the layer's current title", async () => {
    const { node, map, Wrapper } = await setup({
        mockMapRender: true
    });
    await waitForMapRender(map);

    const layer = map.layers.getLayerById("test-layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    let layerLabel = getLabelNode(container)?.textContent;

    expect(layerLabel).toEqual("Test Layer");
    await act(async () => {
        layer.setTitle("New title");
        await nextTick();
    });
    layerLabel = getLabelNode(container)?.textContent;
    expect(layerLabel).toEqual("New title");
});

it("displays the layer's current visibility", async () => {
    const { map, node, Wrapper } = await setup({
        mockMapRender: true
    });

    const layer = map.layers.getLayerById("test-layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }
    expect(layer.visible).toBe(true);

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
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
    const { map, node, Wrapper } = await setup({
        mockMapRender: true
    });

    const layer = map.layers.getLayerById("test-layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
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
    const { map, node, Wrapper } = await setup({
        mockMapRender: true
    });
    const layer = node.layer;
    await waitForMapRender(map);

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    const item = findListItemForLayer(container, layer.id); //css class for layer id
    expect(item).toBeTruthy();
    expect(item?.classList.contains(`layer-${layer.id}`)).toBe(true);
});

it("renders buttons if layer has description property", async () => {
    const { node, Wrapper } = await setup({
        layer: {
            id: "layer-1",
            title: "Layer 1",
            olLayer: createTestOlLayer(),
            description: "Description"
        },
        mockMapRender: true
    });

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    const initialItems = queryAllByRole(container, "button");
    expect(initialItems).toHaveLength(1);
});

it("renders no buttons if layer has no description property", async () => {
    const { node, Wrapper } = await setup({
        layer: {
            id: "layer-1",
            title: "Layer 1",
            olLayer: createTestOlLayer(),
            description: undefined //no layer description
        },
        mockMapRender: true
    });

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    const initialItems = queryAllByRole(container, "button");
    expect(initialItems).toHaveLength(0);
});

it("changes the description popover's visibility when toggling the button", async () => {
    const { map, node, Wrapper } = await setup({
        layer: {
            id: "layer",
            title: "Layer 1",
            olLayer: createTestOlLayer(),
            description: "Description"
        },
        mockMapRender: true
    });

    const layer = map.layers.getLayerById("layer");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    const button = queryByRole(container, "button");
    if (!button) {
        throw new Error("description button not found!");
    }

    //initially not there because of lazy mounting of popover
    expect(() => screen.getByText(layer.description)).toThrow(
        "Unable to find an element with the text: Description. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible."
    );

    // open the popover
    fireEvent.click(button);
    await waitFor(async () => {
        const description = screen.getByText(layer.description);
        expect(description).toBeVisible();
    });

    // close the popover again
    fireEvent.click(button);
    await waitFor(async () => {
        const description = screen.queryByText(layer.description);
        expect(description).toBeFalsy(); // Popover should unmount
    });
});

it("reacts to changes in the layer description", async () => {
    const { map, node, Wrapper } = await setup({
        layer: {
            id: "layer1",
            title: "Layer 1",
            olLayer: createTestOlLayer(),
            description: "Description"
        },
        mockMapRender: true
    });
    await waitForMapRender(map);

    const layer = map.layers.getLayerById("layer1");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    const initialItems = queryAllByRole(container, "button");
    expect(initialItems).toHaveLength(1);
    //need to open popover because of lazy mounting of popover
    const button = initialItems[0]!;
    await act(async () => {
        fireEvent.click(button);
        await nextTick();
    });

    screen.getByText("Description");
    await act(async () => {
        layer.setDescription("New description");
        await nextTick();
    });
    screen.getByText("New description");
});

it("reacts to changes of the layer load state", async () => {
    const source = new OSM();

    const { map, node, Wrapper } = await setup({
        layer: {
            id: "layer1",
            title: "Layer 1",
            description: "Description 1",
            olLayer: new TileLayer({
                source: source
            })
        },
        mockMapRender: true
    });
    await waitForMapRender(map);

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox")!;
    const button = queryByRole<HTMLInputElement>(container, "button");
    let icons = container.querySelectorAll(PROBLEM_INDICATOR_SELECTOR);

    expect(checkbox).toBeTruthy();
    expect(checkbox.disabled).toBe(false);
    expect(button?.disabled).toBe(false);
    expect(icons).toHaveLength(0);

    await act(async () => {
        source.setState("error");
        await nextTick();
    });

    icons = container.querySelectorAll(PROBLEM_INDICATOR_SELECTOR);
    expect(checkbox.disabled).toBe(true);
    expect(button?.disabled).toBe(true);
    expect(icons).toHaveLength(1);
    // The problem is announced via the checkbox's accessible label; the icon itself is decorative.
    expect(getAccessibleLabel(container)).toMatchInlineSnapshot(`
      "  Layer 1
        layerNotAvailable"
    `);

    // and back
    await act(async () => {
        source.setState("ready");
        await nextTick();
    });

    icons = container.querySelectorAll(PROBLEM_INDICATOR_SELECTOR);
    expect(checkbox.disabled).toBe(false);
    expect(button?.disabled).toBe(false);
    expect(icons).toHaveLength(0);
});

it("updates problem indicators when there are visibility issues", async () => {
    const { map, node, Wrapper } = await setup({
        layer: {
            id: "layer1",
            title: "Layer 1",
            minZoom: 9,
            maxZoom: 16,
            olLayer: createTestOlLayer()
        },
        mockMapRender: true
    });
    await waitForMapRender(map);

    const layer = map.layers.getLayerById("layer1");
    if (!layer) {
        throw new Error("test layer not found!");
    }

    const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });
    {
        const icons = container.querySelectorAll(PROBLEM_INDICATOR_SELECTOR);
        expect(icons).toHaveLength(0);
    }
    // set map out of layer visibility
    await act(async () => {
        map.olView.setZoom(5);
        await nextTick();
    });
    const icons = container.querySelectorAll(PROBLEM_INDICATOR_SELECTOR);
    expect(icons).toHaveLength(1);
    // The problem is announced via the checkbox's accessible label; the icon itself is decorative.
    expect(getAccessibleLabel(container)).toMatchInlineSnapshot(`
      "  Layer 1
        layerNotVisible"
    `);
});

it("calls renderNestedList with the node's shown children and list props", async () => {
    const { group } = createGroupHierarchy();
    const { node: groupNode, Wrapper } = await setup({ layer: group, mockMapRender: true });

    expect(groupNode.shownChildren.length).toBeGreaterThan(0);

    const { container } = render(<LayerItem node={groupNode} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    // The (mock) nested list returned by the callback is actually rendered in the DOM.
    const nestedList = await waitFor(() => {
        const nestedList = container.querySelector<HTMLElement>(MOCK_NESTED_LIST_SELECTOR);
        expect(nestedList).not.toBeNull();
        return nestedList!;
    });

    // Test that the layer item renders the expected children (using our mock rendering function).
    const expectedChildren = groupNode.shownChildren;
    expect(expectedChildren.length).toBeGreaterThan(0);
    expect(nestedList.dataset.nodeIds).toBe(expectedChildren.map((n) => n.id).join(","));
    expect(nestedList.getAttribute("aria-label")).toBe("childgroupLabel");
    expect(nestedList.id).toBeTruthy();
});

it("does not call renderNestedList for a leaf node (no children)", async () => {
    const { node: leafNode, Wrapper } = await setup({
        layer: {
            title: "Leaf",
            id: "leaf",
            olLayer: createTestOlLayer()
        },
        mockMapRender: true
    });

    expect(leafNode).toBeDefined();
    expect(leafNode.children.length).toBe(0);

    const { container } = render(<LayerItem node={leafNode} renderNestedList={mockNestedList} />, {
        wrapper: Wrapper
    });

    // The (mock) nested list is not rendered in the DOM because the node has no children.
    await waitFor(() => {
        expect(findListItemForLayer(container, "leaf")).not.toBeNull();
    });
    expect(container.querySelector(MOCK_NESTED_LIST_SELECTOR)).toBeNull();
});

describe("list mode", () => {
    it("displays the layer item only if the layer is not internal", async () => {
        const { map, node, Wrapper } = await setup({
            layer: {
                id: "layer",
                title: "Layer 1",
                olLayer: createTestOlLayer(),
                internal: false
            },
            mockMapRender: true
        });

        const layer = node.layer;

        const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
            wrapper: Wrapper
        });

        let layerItem = findListItemForLayer(container, layer.id);
        expect(layerItem).toBeTruthy();

        await act(async () => {
            layer.setInternal(true); //make layer internal
            await nextTick();
        });
        layerItem = findListItemForLayer(container, layer.id); //layer item should not be there anymore
        expect(layerItem).toBeFalsy();
    });

    it("displays the layer item only if the list mode is not `hide`", async () => {
        const { node, Wrapper } = await setup({
            layer: {
                id: "layer",
                title: "Layer 1",
                olLayer: createTestOlLayer(),
                internal: false,
                attributes: {
                    toc: {
                        listMode: "show"
                    }
                }
            }
        });

        const layer = node.layer;

        const { container } = render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
            wrapper: Wrapper
        });

        let layerItem = findListItemForLayer(container, layer.id);
        expect(layerItem).toBeTruthy();

        await act(async () => {
            layer.setInternal(true); //make layer internal
            await nextTick();
        });
        //layer item should still be there because toc specific listMode has precedence over internal attribute
        layerItem = findListItemForLayer(container, layer.id);
        expect(layerItem).toBeTruthy();

        await act(async () => {
            layer.setInternal(false);
            layer.updateAttributes({
                toc: {
                    listMode: "hide-children"
                }
            });
            await nextTick();
        });
        //layer item should still be there because `hide-children` should not affect the layer item itself
        layerItem = findListItemForLayer(container, layer.id);
        expect(layerItem).toBeTruthy();

        await act(async () => {
            layer.updateAttributes({
                toc: {
                    listMode: "hide"
                }
            });
            await nextTick();
        });
        layerItem = findListItemForLayer(container, layer.id);
        expect(layerItem).toBeFalsy();
    });
});

describe("htmlElement for list item", () => {
    it("sets and unsets the html element when the layer item is shown or hidden", async () => {
        const { node, Wrapper } = await setup({ mockMapRender: true });
        const layer = node.layer;

        render(<LayerItem node={node} renderNestedList={mockNestedList} />, {
            wrapper: Wrapper
        });
        // Group layer is not internal, so the htmlElement should be set.
        await waitFor(() => {
            expect(node.htmlElement).toBeDefined();
        });

        layer.setInternal(true);
        // The htmlElement should be unset when the layer is internal (and thus not displayed in the TOC).
        await waitFor(() => {
            expect(node.htmlElement).toBeUndefined();
        });

        layer.setInternal(false);
        // The htmlElement should be set again when the layer is no longer internal (and thus displayed in the TOC).
        await waitFor(() => {
            expect(node.htmlElement).toBeDefined();
        });
    });
});

function getAccessibleLabel(item: HTMLElement) {
    const label = getLabelNode(item);
    if (!label) {
        return "";
    }
    return textTree(label);
}

function getLabelNode(item: HTMLElement) {
    return item.querySelector(".chakra-checkbox__label") ?? null;
}

function textTree(node: Node, indent = ""): string {
    const lines: string[] = [];
    for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim();
            if (text) {
                lines.push(indent + text);
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childTree = textTree(child, indent + "  ");
            if (childTree) {
                lines.push(childTree);
            }
        }
    }
    return lines.join("\n");
}

function findListItemForLayer(container: HTMLElement, id: string) {
    return container.querySelector(`li.toc-layer-item.layer-${id}`) as HTMLElement | null;
}

function createGroupHierarchy() {
    const o1 = createTestOlLayer();
    const o2 = createTestOlLayer();
    const submember = createTestLayer({
        id: "submember",
        title: "subgroup member",
        olLayer: o2,
        visible: false
    });
    const subgroup = createTestLayer({
        type: GroupLayer,
        id: "subgroup",
        title: "a nested group layer",
        visible: false,
        layers: [submember]
    });
    const group = createTestLayer({
        type: GroupLayer,
        id: "group",
        title: "a group layer",
        visible: false,
        layers: [
            createTestLayer({
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

async function setup(opts?: {
    layer?: LayerConfig;
    mockMapRender?: boolean;
    tocOptions?: Partial<TocWidgetOptions>;
}) {
    const testLayerId = opts?.layer?.id ?? "test-layer";
    const testLayerConfig: LayerConfig = {
        id: "test-layer",
        title: "Test Layer",
        olLayer: createTestOlLayer(),
        visible: true
    };

    const { map } = await setupMap({
        layers: [opts?.layer ?? testLayerConfig],
        mockMapRender: opts?.mockMapRender
    });

    const sharedData: SharedData = {
        nodesById: reactiveMap<string, TocLayerNode>(),
        options: {
            autoShowParents: opts?.tocOptions?.autoShowParents ?? true,
            collapsibleGroups: opts?.tocOptions?.collapsibleGroups ?? true,
            initiallyCollapsed: opts?.tocOptions?.initiallyCollapsed ?? false
        }
    };

    const testLayer = map.layers.getLayerById(testLayerId);

    if (!testLayer) {
        throw new Error(`Test layer with id "${testLayerId}" not found in map!`);
    }

    const node = new TocLayerNode(testLayer, undefined, sharedData);
    onTestFinished(() => node.destroy());

    function Wrapper(props: { children?: ReactNode }) {
        return <PackageContextProvider>{props.children}</PackageContextProvider>;
    }

    return { node, map, Wrapper };
}

const MOCK_NESTED_LIST_SELECTOR = '[data-testid="mock-nested-list"]';

/** Replacement for the real nested list; renders its arguments so tests can inspect them in the DOM. */
function mockNestedList(nodes: TocLayerNode[], listProps: ListRootProps): ReactNode {
    return (
        <div
            data-testid="mock-nested-list"
            data-node-ids={nodes.map((node) => node.id).join(",")}
            id={listProps.id}
            aria-label={listProps["aria-label"]}
        />
    );
}
