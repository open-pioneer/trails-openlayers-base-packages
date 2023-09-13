// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment happy-dom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { expect, it, describe } from "vitest";
import { BasemapSwitcher, NO_BASEMAP_ID } from "./BasemapSwitcher";
import {
    createPackageContextProviderProps,
    setupMap,
    waitForMapMount
} from "@open-pioneer/map/test-utils";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { BkgTopPlusOpen } from "@open-pioneer/map";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

const defaultBasemapConfig = [
    {
        id: "osm",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        layer: new TileLayer({
            source: new OSM()
        })
    },
    {
        id: "topplus-open",
        title: "TopPlus Open",
        isBaseLayer: true,
        visible: false,
        layer: new TileLayer({
            source: new BkgTopPlusOpen()
        })
    }
];

it("should successfully create a basemap switcher component", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher
                    mapId={mapId}
                    label="Hintergrundkarte"
                    noneBasemap
                ></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

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

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId} className="test" pl="1px"></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv).toMatchSnapshot();

    expect(switcherDiv).toBeInstanceOf(HTMLDivElement);
    expect(switcherDiv.classList.contains("test")).toBe(true);
    expect(switcherDiv.classList.contains("foo")).toBe(false);

    const styles = window.getComputedStyle(switcherDiv);
    expect(styles.paddingLeft).toBe("1px");
});

it("should successfully select a basemap from basemap switcher", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });

    const map = await registry.expectMapModel(mapId);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId}></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

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

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId} noneBasemap></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect).toMatchInlineSnapshot(`
      <select
        aria-label="defaultLabel"
        class="chakra-select basemap-switcher-select css-161pkch"
        data-theme="light"
        id="field-:r3:"
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
          noneBasemapLabel
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

it("should successfully select noneBasemap, if all configured basemaps are configured as not visible", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                id: "b-1",
                title: "OSM",
                isBaseLayer: true,
                visible: false,
                layer: new TileLayer({
                    source: new OSM()
                })
            },
            {
                id: "b-2",
                title: "topplus-open",
                isBaseLayer: true,
                visible: false,
                layer: new TileLayer({
                    source: new BkgTopPlusOpen()
                })
            }
        ]
    });

    const map = await registry.expectMapModel(mapId);

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId} label="Hintergrundkarte"></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect).toMatchInlineSnapshot(`
      <select
        aria-label="Hintergrundkarte"
        class="chakra-select basemap-switcher-select css-161pkch"
        data-theme="light"
        id="field-:r4:"
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
          noneBasemapLabel
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
    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId}></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherSelect } = await waitForBasemapSwitcher();
    expect(switcherSelect.options.length).toBe(2);

    act(() => {
        map.layers.createLayer({
            id: "foo",
            title: "Foo",
            isBaseLayer: true,
            layer: new TileLayer({
                source: new OSM()
            })
        });
    });

    expect(switcherSelect.options.length).toBe(3);
    expect(switcherSelect).toMatchInlineSnapshot(`
      <select
        aria-label="defaultLabel"
        class="chakra-select basemap-switcher-select css-161pkch"
        data-theme="light"
        id="field-:r5:"
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
    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher mapId={mapId}></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

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
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "topplus-open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: false,
                    layer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });

        const map = await registry.expectMapModel(mapId);

        render(
            <PackageContextProvider {...createPackageContextProviderProps(registry)}>
                <div data-testid="base">
                    <MapContainer mapId={mapId} />
                    <BasemapSwitcher mapId={mapId}></BasemapSwitcher>
                </div>
            </PackageContextProvider>
        );

        await waitForMapMount();

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
                    layer: new TileLayer({
                        source: new OSM()
                    })
                },
                {
                    id: "topplus-open",
                    title: "TopPlus Open",
                    isBaseLayer: true,
                    visible: true,
                    layer: new TileLayer({
                        source: new BkgTopPlusOpen()
                    })
                }
            ]
        });

        const map = await registry.expectMapModel(mapId);

        render(
            <PackageContextProvider {...createPackageContextProviderProps(registry)}>
                <div data-testid="base">
                    <MapContainer mapId={mapId} />
                    <BasemapSwitcher mapId={mapId}></BasemapSwitcher>
                </div>
            </PackageContextProvider>
        );

        await waitForMapMount();

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
        const domElement = await screen.findByTestId("base");
        const switcherDiv: HTMLDivElement | null = domElement.querySelector(".basemap-switcher");
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
