// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { OverviewMap } from "./OverviewMap";
import { OverviewMap as OlOverviewMap } from "ol/control";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { BkgTopPlusOpen } from "@open-pioneer/map";
import WMTS from "ol/source/WMTS";
import OlMap from "ol/Map";
import {equals as extentEquals} from "ol/extent";

OlMap.prototype.updateSize = function ()  {
    const target = this.getTargetElement();
    const height = 500;
    const width = 500;
    const size = target ? [width, height] : undefined;
    const oldSize = this.getSize();
    if (size && (!oldSize || !extentEquals(size, oldSize))) {
        this.setSize(size);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).updateViewportSize_();
    }
};
it("should successfully create a overview map component", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap mapId={mapId} layer={layer} data-testid="overview-map"></OverviewMap>
        </PackageContextProvider>
    );

    // overview map div is mounted
    const { overviewMapDiv } = await waitForOverviewMap();
    expect(overviewMapDiv).toMatchSnapshot();
});

it("should successfully create a overview map component with additional css class", async () => {
    const { mapId, registry } = await setupMap();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                layer={layer}
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

it("should successfully add OverviewMap control to the map controls", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getTileLayer();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                layer={layer}
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
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getTileLayerOfWMTS();

    render(
        <PackageContextProvider services={injectedServices}>
            <OverviewMap
                mapId={mapId}
                layer={layer}
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

async function waitForOverviewMap() {
    const { overviewMapDiv } = await waitFor(async () => {
        const overviewMapDiv: HTMLDivElement | null =
            await screen.findByTestId<HTMLDivElement>("overview-map");
        if (!overviewMapDiv) {
            throw new Error("Overview map not rendered");
        }

        return { overviewMapDiv };
    });

    return { overviewMapDiv };
}

function getControl(olMap: OlMap) {
    const controls = olMap.getControls().getArray();
    return controls.find((control) => control instanceof OlOverviewMap) as
        | OlOverviewMap
        | undefined;
}
function getTileLayer() {
    return new TileLayer({
        source: new OSM()
    });
}

function getTileLayerOfWMTS() {
    return new TileLayer({
        source: new BkgTopPlusOpen()
    });
}
