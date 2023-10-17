// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { BkgTopPlusOpen, SimpleLayer } from "@open-pioneer/map";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { describe, expect, it } from "vitest";
import { BasemapSwitcher, NO_BASEMAP_ID } from "./BasemapSwitcher";

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
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId); // wait for model load

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} allowSelectingEmptyBasemap data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherDiv, switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherDiv).toMatchSnapshot();

    // check basemap switcher box and select is available
    expect(switcherDiv).toBeInstanceOf(HTMLDivElement);
    expect(switcherSelect).toBeInstanceOf(HTMLSelectElement);
});

it("should successfully create a basemap switcher component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    await registry.expectMapModel(mapId); // wait for model load

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} className="test" data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv).toMatchSnapshot();

    expect(switcherDiv).toBeInstanceOf(HTMLDivElement);
    expect(switcherDiv.classList.contains("test")).toBe(true);
    expect(switcherDiv.classList.contains("foo")).toBe(false);
});

it("should successfully select a basemap from basemap switcher", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();

    act(() => {
        fireEvent.change(switcherSelect, { target: { value: "osm" } });
    });
    const firstActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(firstActiveBaseLayer?.id).toBe("osm");

    act(() => {
        fireEvent.change(switcherSelect, { target: { value: "topplus-open" } });
    });
    const nextActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(nextActiveBaseLayer?.id).toBe("topplus-open");
});

it("should allow selecting 'no basemap' when enabled", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} allowSelectingEmptyBasemap data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect).toMatchInlineSnapshot(`
      <select
        class="chakra-select basemap-switcher-select css-161pkch"
        data-theme="light"
      >
        <option
          value="osm"
        >
          OSM
        </option>
        <option
          value="topplus-open"
        >
          TopPlus Open
        </option>
        <option
          value="___NO_BASEMAP___"
        >
          emptyBasemapLabel
        </option>
      </select>
    `);
    expect(switcherSelect.value).toBe("osm");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    act(() => {
        fireEvent.change(switcherSelect, { target: { value: NO_BASEMAP_ID } });
    });

    expect(switcherSelect.value).toBe(NO_BASEMAP_ID);
    expect(map.layers.getActiveBaseLayer()).toBe(undefined);
});

it("should successfully select emptyBasemap, if all configured basemaps are configured as not visible", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "b-1",
                title: "OSM",
                isBaseLayer: true,
                visible: false,
                olLayer: new TileLayer({
                    source: new OSM()
                })
            },
            {
                id: "b-2",
                title: "topplus-open",
                isBaseLayer: true,
                visible: false,
                olLayer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect).toMatchInlineSnapshot(`
      <select
        class="chakra-select basemap-switcher-select css-161pkch"
        data-theme="light"
      >
        <option
          value="b-1"
        >
          OSM
        </option>
        <option
          value="b-2"
        >
          topplus-open
        </option>
        <option
          value="___NO_BASEMAP___"
        >
          emptyBasemapLabel
        </option>
      </select>
    `);
    expect(switcherSelect.value).toBe(NO_BASEMAP_ID);

    const activeBaseLayer = map.layers.getActiveBaseLayer();
    expect(activeBaseLayer).toBeUndefined();
});

it("should update when a new basemap is registered", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect.options.length).toBe(2);

    act(() => {
        const layer = new SimpleLayer({
            id: "foo",
            title: "Foo",
            isBaseLayer: true,
            olLayer: new TileLayer({})
        });
        map.layers.addLayer(layer);
    });

    expect(switcherSelect.options.length).toBe(3);
    expect(switcherSelect).toMatchInlineSnapshot(`
      <select
        class="chakra-select basemap-switcher-select css-161pkch"
        data-theme="light"
      >
        <option
          value="osm"
        >
          OSM
        </option>
        <option
          value="topplus-open"
        >
          TopPlus Open
        </option>
        <option
          value="foo"
        >
          Foo
        </option>
      </select>
    `);
});

it("should update when a different basemap is activated from somewhere else", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <BasemapSwitcher mapId={mapId} data-testid="switcher" />
        </PackageContextProvider>
    );

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect.value).toBe("osm");
    expect(map.layers.getActiveBaseLayer()?.id).toBe("osm");

    act(() => {
        map.layers.activateBaseLayer("topplus-open");
    });
    expect(switcherSelect.value).toBe("topplus-open");
});

describe("should successfully select the correct basemap from basemap switcher", () => {
    it("basemap with id `osm` is visible", async () => {
        const { mapId, registry } = await setupMap({
            layers: [
                {
                    id: "osm",
                    title: "OSM",
                    isBaseLayer: true,
                    visible: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "topplus-open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: false,
                    olLayer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });

        const map = await registry.expectMapModel(mapId);
        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <BasemapSwitcher mapId={mapId} data-testid="switcher" />
            </PackageContextProvider>
        );

        // basemap switcher is mounted
        const { switcherSelect } = await waitForBasemapSwitcher();
        expect(switcherSelect.value).toBe("osm");
        expect(switcherSelect.value).not.toBe("topplus-open");

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        expect(activeBaseLayer?.id).toBe("osm");
    });

    it("basemap with id `toner` is visible", async () => {
        const { mapId, registry } = await setupMap({
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
                    olLayer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });

        const map = await registry.expectMapModel(mapId);
        const injectedServices = createServiceOptions({ registry });
        render(
            <PackageContextProvider services={injectedServices}>
                <BasemapSwitcher mapId={mapId} data-testid="switcher" />
            </PackageContextProvider>
        );

        // basemap switcher is mounted
        const { switcherSelect } = await waitForBasemapSwitcher();
        expect(switcherSelect.value).toBe("topplus-open");
        expect(switcherSelect.value).not.toBe("osm");

        const activeBaseLayer = map.layers.getActiveBaseLayer();
        expect(activeBaseLayer?.id).toBe("topplus-open");
    });
});

async function waitForBasemapSwitcher() {
    const { switcherDiv, switcherSelect } = await waitFor(async () => {
        const switcherDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("switcher");
        if (!switcherDiv) {
            throw new Error("basemap switcher not rendered");
        }

        const switcherSelect: HTMLSelectElement | null = switcherDiv.querySelector(
            ".basemap-switcher-select"
        );
        if (!switcherSelect) {
            throw new Error("basemap switcher select not rendered");
        }
        return { switcherDiv, switcherSelect };
    });
    return { switcherDiv, switcherSelect };
}
