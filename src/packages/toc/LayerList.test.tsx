// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import {
    act,
    waitFor,
    fireEvent,
    screen,
    queryAllByRole,
    queryByRole,
    render
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LayerGroup from "ol/layer/Group";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { expect, it } from "vitest";
import { LayerList } from "./LayerList";
import { SimpleLayer } from "@open-pioneer/map";

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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    /*
       Labels are configured from bottom to top, but the TOC lists
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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    const labels = getCurrentLabels(container);
    expect(labels).toEqual(["Layer 2", "Layer 1"]);
});

it("shows a fallback message if there are no layers", async function () {
    const { mapId, registry } = await setupMap({
        layers: []
    });
    const map = await registry.expectMapModel(mapId);

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    const initialItems = getCurrentItems(container);
    expect(initialItems).toHaveLength(1);

    act(() => {
        map.layers.addLayer(
            new SimpleLayer({
                title: "Layer 2",
                olLayer: new TileLayer({})
            })
        );
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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    expect(getCurrentLabels(container)).toEqual(["Layer 1"]);
    act(() => {
        layer.setTitle("New title");
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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox");
    expect(checkbox).toBeTruthy();
    expect(checkbox!.checked).toBe(true);

    act(() => {
        layer.setVisible(false);
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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    // Initial state reflects layer state (visible)
    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox")!;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(true);
    expect(layer.visible).toBe(true);

    // Click sets both to false
    await act(async () => {
        await user.click(checkbox);
    });
    expect(checkbox!.checked).toBe(false);
    expect(layer.visible).toBe(false);

    // Clicking again sets it to true again
    await act(async () => {
        await user.click(checkbox);
    });
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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );
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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

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

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );
    const initialItems = queryAllByRole(container, "button");
    expect(initialItems).toHaveLength(1);
    screen.getByText("Description");
    act(() => {
        layer.setDescription("New description");
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
    const layer = map.layers.getLayerById("layer1");

    const { container } = render(
        <PackageContextProvider>
            <LayerList map={map} />
        </PackageContextProvider>
    );

    const checkbox = queryByRole<HTMLInputElement>(container, "checkbox")!;
    const button = queryByRole<HTMLInputElement>(container, "button");
    let icons = container.querySelectorAll(".toc-layer-item-content-icon");

    expect(checkbox).toBeTruthy();
    expect(checkbox.disabled).toBe(false);
    expect(button?.disabled).toBe(false);
    expect(icons).toHaveLength(0);

    act(() => {
        source.setState("error");
    });

    icons = container.querySelectorAll(".toc-layer-item-content-icon");
    expect(checkbox.disabled).toBe(true);
    expect(button?.disabled).toBe(true);
    expect(icons).toHaveLength(1);

    // and back
    act(() => {
        source.setState("ready");
    });

    icons = container.querySelectorAll(".toc-layer-item-content-icon");
    expect(checkbox.disabled).toBe(false);
    expect(button?.disabled).toBe(false);
    expect(icons).toHaveLength(0);
});

/** Returns the layer list's current list items. */
function getCurrentItems(container: HTMLElement) {
    return queryAllByRole(container, "listitem");
}

/** Returns only the labels of the layer list's current items. */
function getCurrentLabels(container: HTMLElement) {
    return getCurrentItems(container).map((item) => item.textContent);
}
