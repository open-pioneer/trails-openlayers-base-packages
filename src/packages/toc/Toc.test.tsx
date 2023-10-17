// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { Toc } from "./Toc";

const BASEMAP_SWITCHER_CLASS = ".basemap-switcher";

it("should successfully create a toc component", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: new TileLayer({}),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({})
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: new TileLayer({})
            }
        ]
    });
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc mapId={mapId} data-testid="toc" />
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    await waitForBasemapSwitcher(tocDiv!);
    expect(tocDiv).toMatchSnapshot();
});

it("should successfully create a toc component with additional css classes", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc mapId={mapId} className="test" data-testid="toc" />
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    expect(tocDiv.classList.contains("test")).toBe(true);
});

it("should embed the basemap switcher by default", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc mapId={mapId} data-testid="toc"></Toc>
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    const { basemapSwitcher } = await waitForBasemapSwitcher(tocDiv!);
    expect(basemapSwitcher.tagName).toBe("DIV");
});

it("should not show the basemap switcher if 'showBasemapSwitcher' is set to false", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc mapId={mapId} showBasemapSwitcher={false} data-testid="toc"></Toc>
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    const basemapSwitcher = tocDiv.querySelector(BASEMAP_SWITCHER_CLASS);
    expect(basemapSwitcher).toBeNull();
});

it("should support overriding basemap-switcher properties", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "OSM",
                olLayer: new TileLayer({}),
                isBaseLayer: true
            }
        ]
    });
    await registry.expectMapModel(mapId);

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Toc
                mapId={mapId}
                basemapSwitcherProps={{
                    allowSelectingEmptyBasemap: true,
                    className: "test-class"
                }}
                data-testid="toc"
            />
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    const { basemapSwitcher, basemapSelect } = await waitForBasemapSwitcher(tocDiv!);
    expect(basemapSwitcher?.classList.contains("test-class")).toBe(true);

    // Weird timing problem w.r.t. select options in basemap switcher
    await new Promise((resolve) => setTimeout(resolve, 100));
    const options = basemapSelect.querySelectorAll("option");
    const optionLabels = Array.from(options).map((opt) => opt.textContent);
    expect(optionLabels).toMatchInlineSnapshot(`
      [
        "OSM",
        "emptyBasemapLabel",
      ]
    `);
});

async function findToc() {
    const tocDiv = await screen.findByTestId("toc");
    return tocDiv;
}

async function waitForBasemapSwitcher(tocDiv: HTMLElement) {
    return await waitFor(() => {
        const basemapSwitcher = tocDiv.querySelector(BASEMAP_SWITCHER_CLASS);
        if (!basemapSwitcher) {
            throw new Error("basemap switcher not mounted");
        }

        const basemapSelect = basemapSwitcher?.querySelector("select");
        if (!basemapSelect) {
            throw new Error("failed to find select element in basemap switcher");
        }
        return { basemapSwitcher, basemapSelect };
    });
}
