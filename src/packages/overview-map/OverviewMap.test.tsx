// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { BkgTopPlusOpen } from "@open-pioneer/map";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { render, screen, waitFor } from "@testing-library/react";
import OlMap from "ol/Map";
import { OverviewMap as OlOverviewMap } from "ol/control";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import WMTS from "ol/source/WMTS";
import { expect, it } from "vitest";
import { OverviewMap } from "./OverviewMap";

it("should successfully create a overview map component", async () => {
    const { mapId, injectedServices } = await setup();
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap mapId={mapId} olLayer={layer} data-testid="overview-map"></OverviewMap>
        </PackageContextProvider>
    );

    const { overviewMapDiv, olOverviewDiv } = await waitForOverviewMap();

    // Parent element
    expect(overviewMapDiv.tagName).toBe("DIV");
    expect(overviewMapDiv.classList.contains("overview-map")).toBe(true);

    // The inner OpenLayers overview map
    expect(olOverviewDiv?.tagName).toBe("DIV");
});

it("should successfully create a overview map component with additional css class", async () => {
    const { mapId, injectedServices } = await setup();
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                olLayer={layer}
                className="test"
                data-testid="overview-map"
            ></OverviewMap>
        </PackageContextProvider>
    );

    // overview map div is mounted
    const { overviewMapDiv } = await waitForOverviewMap();
    expect(overviewMapDiv.classList.contains("test")).toBe(true);
    expect(overviewMapDiv.classList.contains("foo")).toBe(false);
});

it("should allow configuration of width and height", async () => {
    const { mapId, injectedServices } = await setup();
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                olLayer={layer}
                data-testid="overview-map"
                width="123px"
                height="456px"
            ></OverviewMap>
        </PackageContextProvider>
    );

    const { overviewMapDiv } = await waitForOverviewMap();
    expect(overviewMapDiv).toHaveStyle({
        width: "123px",
        height: "456px"
    });
});

it("should successfully add OverviewMap control to the map controls", async () => {
    const { mapId, map, injectedServices } = await setup();
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                olLayer={layer}
                className="test"
                data-testid="overview-map"
            ></OverviewMap>
        </PackageContextProvider>
    );

    await waitForOverviewMap();
    const overViewMapControl = getControl(map.olMap);
    expect(overViewMapControl).toBeDefined();
});

it("should support basemap type of OGC WMTS layer as a layer shown in the overview map", async () => {
    const { mapId, map, injectedServices } = await setup();
    const layer = getTileLayerOfWMTS();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                olLayer={layer}
                className="test"
                data-testid="overview-map"
            ></OverviewMap>
        </PackageContextProvider>
    );

    await waitForOverviewMap();
    const overViewMapControl = getControl(map.olMap);
    const wmtsLayer: TileLayer<WMTS> = overViewMapControl
        ?.getOverviewMap()
        ?.getLayers()
        .getArray()[0] as TileLayer<WMTS>;
    const source = wmtsLayer?.getSource();

    expect(wmtsLayer).toBeInstanceOf(TileLayer);
    expect(source).toBeInstanceOf(WMTS);
});

async function setup() {
    const { mapId, registry } = await setupMap();
    const injectedServices = createServiceOptions({ registry });
    const map = await registry.expectMapModel(mapId);
    return { mapId, registry, map, injectedServices };
}

async function waitForOverviewMap() {
    const overviewMapDiv = await screen.findByTestId("overview-map");
    const olOverviewDiv = await waitFor(() => {
        const child = overviewMapDiv.querySelector("> .ol-overviewmap");
        if (!child) {
            throw new Error("OpenLayers overview map control did not mount");
        }
        return child;
    });
    return { overviewMapDiv, olOverviewDiv };
}

function getControl(olMap: OlMap) {
    const controls = olMap.getControls().getArray();
    return controls.find((control) => control instanceof OlOverviewMap) as
        | OlOverviewMap
        | undefined;
}

function getTileLayer() {
    const layer = new TileLayer({
        source: new OSM()
    });
    mockRender(layer);
    return layer;
}

function getTileLayerOfWMTS() {
    const layer = new TileLayer({
        source: new BkgTopPlusOpen()
    });
    mockRender(layer);
    return layer;
}

function mockRender(layer: TileLayer<any>) {
    // Overwrite render so it doesn't actually do anything during tests.
    // Would otherwise error because <canvas /> is not fully implemented in happy dom.
    const element = document.createElement("div");
    layer.render = () => element;
    return layer;
}
