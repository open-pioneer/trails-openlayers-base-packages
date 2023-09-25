// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { MapContainer } from "@open-pioneer/map";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { Toc } from "./Toc";
import { createServiceOptions, setupMap, waitForMapMount } from "@open-pioneer/map-test-utils";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

it("should successfully create a toc component", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <Toc mapId={mapId}></Toc>
            </div>
        </PackageContextProvider>
    );

    // toc is mounted
    const { tocDiv, tocHeader } = await waitForToc();
    expect(tocDiv).toMatchSnapshot();

    // check toc box is available
    expect(tocHeader).toBeInstanceOf(HTMLDivElement);
});

it("should successfully create a toc component with additional css classes and box properties", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <Toc mapId={mapId} className="test" pl="1px"></Toc>
            </div>
        </PackageContextProvider>
    );

    // toc is mounted
    const { tocDiv } = await waitForToc();
    expect(tocDiv).toMatchSnapshot();

    expect(tocDiv).toBeInstanceOf(HTMLDivElement);
    expect(tocDiv.classList.contains("test")).toBe(true);
    expect(tocDiv.classList.contains("foo")).toBe(false);

    const styles = window.getComputedStyle(tocDiv);
    expect(styles.paddingLeft).toBe("1px");
});

it("should not show the basemap switcher if 'showBasemapSwitcher' configured to false", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <Toc mapId={mapId} hideBasemapSwitcher={true}></Toc>
            </div>
        </PackageContextProvider>
    );

    // toc is mounted
    const { tocDiv } = await waitForToc();
    expect(tocDiv).toMatchSnapshot();
});

it("should be possible to override basemap-switcher properties", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "OSM",
                layer: new TileLayer({
                    source: new OSM()
                }),
                isBaseLayer: true
            }
        ]
    });

    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <div data-testid="base">
                <MapContainer mapId={mapId} />
                <Toc
                    mapId={mapId}
                    basemapSwitcherProps={{
                        allowSelectingEmptyBasemap: true,
                        className: "test-class"
                    }}
                ></Toc>
            </div>
        </PackageContextProvider>
    );
    await waitForMapMount();

    const { tocDiv, switcherDiv, switcherSelect } = await waitForToc();

    // toc is mounted
    expect(tocDiv.classList.contains("toc")).toBe(true);
    expect(switcherDiv?.classList.contains("test-class")).toBe(true);
    expect(switcherSelect?.options.length).toBe(2);
});

async function waitForToc() {
    const { tocDiv, tocHeader, switcherDiv, switcherSelect } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");

        const tocDiv = domElement.querySelector(".toc");
        if (!tocDiv) {
            throw new Error("Toc not rendered");
        }

        const tocHeader = tocDiv.querySelector(".toc-header");
        if (!tocHeader) {
            throw new Error("Toc header not rendered");
        }

        const switcherDiv = tocDiv.querySelector(".basemap-switcher");
        const switcherSelect = tocDiv.querySelector<HTMLSelectElement>(".basemap-switcher-select");

        return { tocDiv, tocHeader, switcherDiv, switcherSelect };
    });

    return { tocDiv, tocHeader, switcherDiv, switcherSelect };
}
