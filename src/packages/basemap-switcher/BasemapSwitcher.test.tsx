// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment happy-dom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { expect, it } from "vitest";
import { BasemapSwitcher } from "./BasemapSwitcher";
import {
    createPackageContextProviderProps,
    setupMap,
    waitForMapMount
} from "@open-pioneer/map/test-utils";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stamen from "ol/source/Stamen";

// used to avoid a "ResizeObserver is not defined" error
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

const defaultBasemapConfig = [
    {
        id: "b-1",
        title: "OSM",
        isBaseLayer: true,
        visible: true,
        layer: new TileLayer({
            source: new OSM()
        })
    },
    {
        id: "b-2",
        title: "Toner",
        isBaseLayer: true,
        visible: false,
        layer: new TileLayer({
            source: new Stamen({ layer: "toner" })
        })
    }
];

it("should successfully create a basemap switcher component", async () => {
    const { mapId, registry } = await setupMap({
        layers: defaultBasemapConfig
    });
    const noneBasemap = {
        id: "noBasemap",
        label: "Ohne Hintergrund",
        selected: false
    };

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher
                    mapId={mapId}
                    label="Hintergrundkarte"
                    noneBasemap={noneBasemap}
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
        fireEvent.change(switcherSelect, { target: { value: "OSM" } });
    });
    const firstActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(firstActiveBaseLayer?.id).toBe("b-1");

    act(() => {
        fireEvent.change(switcherSelect, { target: { value: "Toner" } });
    });
    const nextActiveBaseLayer = map.layers.getActiveBaseLayer();
    expect(nextActiveBaseLayer?.id).toBe("b-2");
});

async function waitForBasemapSwitcher() {
    const { switcherDiv, switcherSelect } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const switcherDiv = domElement.querySelector(".basemap-switcher");
        if (!switcherDiv) {
            throw new Error("basemap switcher not rendered");
        }

        const switcherSelect = switcherDiv.querySelector(".basemap-switcher-select");
        if (!switcherSelect) {
            throw new Error("basemap switcher select not rendered");
        }
        return { switcherDiv, switcherSelect };
    });
    return { switcherDiv, switcherSelect };
}
