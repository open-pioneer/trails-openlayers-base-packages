// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { BasemapSwitcher } from "./BasemapSwitcher";
import { createPackageContextProviderProps, setupMap, waitForMapMount } from "./test-utils";
import ResizeObserver from "resize-observer-polyfill";

// used to avoid a "ResizeObserver is not defined" error
global.ResizeObserver = ResizeObserver;

const noneBasemap = {
    id: "noBasemap",
    label: "kein Hintergrund"
};
it("should successfully create a basemap switcher component", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher
                    mapId={mapId}
                    baseLayerId="b-1"
                    noneBasemap={noneBasemap}
                ></BasemapSwitcher>
            </div>
        </PackageContextProvider>
    );

    await waitForMapMount();

    // basemap switcher is mounted
    const { switcherDiv } = await waitForBasemapSwitcher();
    expect(switcherDiv).toMatchSnapshot();

    // check basemap switcher box is available
    expect(switcherDiv).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a basemap switcher component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();
    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <BasemapSwitcher
                    mapId={mapId}
                    className="test"
                    pl="1px"
                    baseLayerId="b-1"
                    noneBasemap={noneBasemap}
                ></BasemapSwitcher>
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

async function waitForBasemapSwitcher() {
    const { domElement, switcherDiv } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");
        const switcherDiv = domElement.querySelector(".basemap-switcher"); // find first HTMLDivElement in basemap switcher component
        if (!switcherDiv) {
            throw new Error("basemap switcher not rendered");
        }

        const select = switcherDiv.querySelector("select");
        if (!select) {
            throw new Error("basemap switcher select not rendered");
        }
        return { domElement, switcherDiv };
    });
    return { domElement, switcherDiv };
}
