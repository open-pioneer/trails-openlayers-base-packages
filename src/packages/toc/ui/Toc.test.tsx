// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import TileLayer from "ol/layer/Tile";
import { expect, it } from "vitest";
import { Toc } from "./Toc";
import { nextTick } from "@conterra/reactivity-core";

const BASEMAP_SWITCHER_CLASS = ".basemap-switcher";
const BASEMAP_SWITCHER_SELECT_CLASS = ".basemap-switcher-select";
const BASEMAP_SWITCHER_CONTENT_CLASS = ".basemap-switcher-select-content";
const BASEMAP_SWITCHER_TRIGGER_CLASS = ".basemap-switcher-select-trigger";

it("should successfully create a toc component", async () => {
    const { map, registry } = await setupMap({
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
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc map={map} data-testid="toc" />
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    const { basemapSelectTrigger } = await waitForBasemapSwitcher(tocDiv!);

    // select lazy mounts the list of options in dom after opening selection
    await act(async () => {
        fireEvent.click(basemapSelectTrigger);
        await nextTick();
    });

    await waitFor(() => {
        //options are portalled
        const basemapSwitcherContent = document.querySelector(BASEMAP_SWITCHER_CONTENT_CLASS);
        if (!basemapSwitcherContent) {
            throw new Error("expected basemap switcher content not rendered");
        }
        const options = basemapSwitcherContent.getElementsByClassName("basemap-switcher-option");
        if (options.length !== 1 || options[0]?.textContent !== "Base layer") {
            throw new Error("expected basemap switcher to contain the Base layer option");
        }
    });
    expect(tocDiv).toMatchSnapshot();
});

it("should successfully create a toc component with additional css classes", async () => {
    const { map, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc map={map} className="test" data-testid="toc" />
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    expect(tocDiv.classList.contains("test")).toBe(true);
});

it("should embed the basemap switcher by default", async () => {
    const { map, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc map={map} data-testid="toc"></Toc>
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    const { basemapSwitcher } = await waitForBasemapSwitcher(tocDiv!);
    expect(basemapSwitcher.tagName).toBe("DIV");
});

it("should not show the basemap switcher if 'showBasemapSwitcher' is set to false", async () => {
    const { map, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Toc map={map} showBasemapSwitcher={false} data-testid="toc"></Toc>
        </PackageContextProvider>
    );

    const tocDiv = await findToc();
    const basemapSwitcher = tocDiv.querySelector(BASEMAP_SWITCHER_CLASS);
    expect(basemapSwitcher).toBeNull();
});

it("should support overriding basemap-switcher properties", async () => {
    const { map, registry } = await setupMap({
        layers: [
            {
                title: "OSM",
                olLayer: new TileLayer({}),
                isBaseLayer: true
            }
        ]
    });

    const injectedServices = createServiceOptions({ registry });
    render(
        <PackageContextProvider services={injectedServices}>
            <Toc
                map={map}
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

    // react-select creates list of options in dom after opening selection
    act(() => {
        fireEvent.keyDown(basemapSelect, { key: "ArrowDown" });
    });

    await waitFor(() => {
        const options = basemapSelect.getElementsByClassName("basemap-switcher-option");
        const optionLabels = Array.from(options).map((opt) => opt.textContent);
        expect(
            optionLabels,
            "basemap options are not equal to their expected values"
        ).toMatchInlineSnapshot(`[]`);
    });
});

async function findToc() {
    return await screen.findByTestId("toc");
}

async function waitForBasemapSwitcher(tocDiv: HTMLElement) {
    return await waitFor(() => {
        const basemapSwitcher = tocDiv.querySelector(BASEMAP_SWITCHER_CLASS);
        if (!basemapSwitcher) {
            throw new Error("basemap switcher not mounted");
        }

        const basemapSelect = basemapSwitcher?.querySelector(BASEMAP_SWITCHER_SELECT_CLASS);
        if (!basemapSelect) {
            throw new Error("failed to find select element in basemap switcher");
        }

        const basemapSelectTrigger = basemapSwitcher?.querySelector(BASEMAP_SWITCHER_TRIGGER_CLASS);
        if (!basemapSelectTrigger) {
            throw new Error("failed to find trigger element in basemap switcher");
        }

        return { basemapSwitcher, basemapSelect, basemapSelectTrigger };
    });
}
