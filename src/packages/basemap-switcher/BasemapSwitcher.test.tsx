// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { nextTick } from "@conterra/reactivity-core";
import { SimpleLayer } from "@open-pioneer/map";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { BasemapSwitcher } from "./BasemapSwitcher";

const defaultBasemapConfig = [
    {
        id: "osm",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        olLayer: new TileLayer({})
    },
    {
        id: "topplus-open",
        title: "TopPlus Open",
        isBaseLayer: true,
        visible: false,
        olLayer: new TileLayer({})
    }
];

it("should successfully create a basemap switcher component", async () => {
    const { registry, map } = await setupMap();

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} allowSelectingEmptyBasemap data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherDiv, switcherSelect } = await waitForBasemapSwitcher();
    showDropdown(switcherSelect);
    expect(switcherDiv).toMatchSnapshot();

    // check basemap switcher box and select is available
    expect(switcherDiv.tagName).toBe("DIV");
    expect(switcherSelect.tagName).toBe("DIV");
    expect(switcherSelect.getElementsByTagName("input").length).toBe(1);
});

it("should successfully create a basemap switcher component with additional css classes and box properties", async () => {
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} className="test" data-testid="switcher" />
        </PackageContextProvider>
    );

    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv.classList.contains("test")).toBe(true);
    expect(switcherDiv.classList.contains("foo")).toBe(false);
});

it("should successfully select a basemap from basemap switcher", async () => {
    const user = userEvent.setup();
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    showDropdown(switcherSelect);

    let options = getCurrentOptions(switcherSelect);
    const osmOption = options.find((option) => option.textContent === "OSM");
    if (!osmOption) {
        throw new Error("Layer OSM missing in basemap options");
    }
    await user.click(osmOption);

    const firstActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(firstActiveBaseLayer?.id).toBe("osm");

    showDropdown(switcherSelect);
    options = getCurrentOptions(switcherSelect);
    const topPlusOption = options.find((option) => option.textContent === "TopPlus Open");
    if (!topPlusOption) {
        throw new Error("Layer topplus-open missing in basemap options");
    }
    await user.click(topPlusOption);

    const nextActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(nextActiveBaseLayer?.id).toBe("topplus-open");
});

it("should allow selecting 'no basemap' when enabled", async () => {
    const user = userEvent.setup();
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} allowSelectingEmptyBasemap data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    expect(switcherSelect.textContent).toBe("OSM");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    showDropdown(switcherSelect);
    const options = getCurrentOptions(switcherSelect);
    const optionsBasemap = options.find((option) => option.textContent === "emptyBasemapLabel");
    if (!optionsBasemap) {
        throw new Error("Layer Basemap missing in basemap options");
    }
    await user.click(optionsBasemap);

    expect(switcherSelect.textContent).toBe("emptyBasemapLabel");
    expect(map.layers.getActiveBaseLayer()).toBe(undefined);
});

it("should not allow selecting 'no basemap' by default", async () => {
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    expect(switcherSelect.textContent).toBe("OSM");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    showDropdown(switcherSelect);
    const options = getCurrentOptions(switcherSelect);
    const optionsEmptyBasemap = options.filter(
        (option) => option.textContent === "emptyBasemapLabel"
    );
    expect(optionsEmptyBasemap).toHaveLength(0);
});

it("should update when a new basemap is registered", async () => {
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    showDropdown(switcherSelect);

    let options = getCurrentOptions(switcherSelect);
    expect(options.length).toBe(2);

    await act(async () => {
        const layer = new SimpleLayer({
            id: "foo",
            title: "Foo",
            isBaseLayer: true,
            olLayer: new TileLayer({})
        });
        map.layers.addLayer(layer);
        await nextTick();
    });

    options = getCurrentOptions(switcherSelect);
    expect(options.length).toBe(3);
    const optionLabels = Array.from(options).map((opt) => opt.textContent);
    expect(optionLabels, "new basemap was added").toMatchInlineSnapshot(`
        [
          "OSM",
          "TopPlus Open",
          "Foo",
        ]
      `);
});

it("should update when a different basemap is activated from somewhere else", async () => {
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect.textContent).toBe("OSM");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    await act(async () => {
        map.layers.activateBaseLayer("topplus-open");
        await nextTick();
    });
    expect(switcherSelect.textContent).toBe("TopPlus Open");
});

describe("should successfully select the correct basemap from basemap switcher", () => {
    it("basemap with id `osm` (first in layers array) is visible", async () => {
        const { registry, map } = await setupMap({
            layers: defaultBasemapConfig
        });

        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <BasemapSwitcher map={map} data-testid="switcher" />
            </PackageContextProvider>
        );

        // basemap switcher is mounted
        const { switcherSelect } = await waitForBasemapSwitcher();
        expect(switcherSelect.textContent).toBe("OSM");
        expect(switcherSelect.textContent).not.toBe("TopPlus Open");

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        expect(activeBaseLayer?.id).toBe("osm");
    });

    it("basemap with id `topplus-open` (second in layers array) is visible", async () => {
        const { registry, map } = await setupMap({
            layers: [
                {
                    id: "osm",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: false,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "topplus-open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: true,
                    olLayer: new TileLayer({})
                }
            ]
        });

        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <BasemapSwitcher map={map} data-testid="switcher" />
            </PackageContextProvider>
        );

        // basemap switcher is mounted
        const { switcherSelect } = await waitForBasemapSwitcher();
        expect(switcherSelect.textContent).toBe("TopPlus Open");
        expect(switcherSelect.textContent).not.toBe("OSM");

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        expect(activeBaseLayer?.id).toBe("topplus-open");
    });
});

it("should disable selection of unavailable layers and show a warning", async () => {
    const osmSource = new OSM();

    act(() => {
        osmSource.setState("error");
    });

    const { registry, map } = await setupMap({
        layers: [
            {
                id: "osm",
                title: "OSM",
                isBaseLayer: true,
                visible: true,
                olLayer: new TileLayer({
                    source: osmSource
                })
            },
            {
                id: "empty-tile",
                title: "Empty tile",
                isBaseLayer: true,
                visible: true,
                olLayer: new TileLayer()
            }
        ]
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    showDropdown(switcherSelect);
    expect(switcherSelect).toMatchSnapshot();
});

it("should update the ui when a layer title changes", async () => {
    const { registry, map } = await setupMap({
        layers: defaultBasemapConfig
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher map={map} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    const activeBaseLayer = map.layers.getActiveBaseLayer();
    expect(activeBaseLayer?.id).toBe("osm");

    showDropdown(switcherSelect);

    let options = getCurrentOptions(switcherSelect);
    let optionLabels = Array.from(options).map((opt) => opt.textContent);
    expect(optionLabels, "basemap options are not equal to their expected values")
        .toMatchInlineSnapshot(`
        [
          "OSM",
          "TopPlus Open",
        ]
      `);

    // change layer title
    await act(async () => {
        activeBaseLayer?.setTitle("New Layer Title");
        await nextTick();
    });

    options = getCurrentOptions(switcherSelect);
    optionLabels = Array.from(options).map((opt) => opt.textContent);
    expect(optionLabels, "basemap layer was not renamed").toMatchInlineSnapshot(`
      [
        "New Layer Title",
        "TopPlus Open",
      ]
    `);
});

function showDropdown(switcherSelect: HTMLElement) {
    // open dropdown to include options in snapshot; react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(switcherSelect, { key: "ArrowDown" });
    });
}

function getCurrentOptions(switcherSelect: HTMLElement) {
    return Array.from(
        switcherSelect.getElementsByClassName("basemap-switcher-option")
    ) as HTMLElement[];
}

async function waitForBasemapSwitcher() {
    const { switcherDiv, switcherSelect } = await waitFor(async () => {
        const switcherDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("switcher");
        if (!switcherDiv) {
            throw new Error("basemap switcher not rendered");
        }

        const switcherSelect: HTMLElement | null = switcherDiv.querySelector(
            ".basemap-switcher-select"
        );
        if (!switcherSelect) {
            throw new Error("basemap switcher select not rendered");
        }
        return { switcherDiv, switcherSelect };
    });
    return { switcherDiv, switcherSelect };
}
