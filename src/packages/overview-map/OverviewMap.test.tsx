// SPDX-FileCopyrightText: con terra GmbH and contributors
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
import { createVectorSource } from "@open-pioneer/ogc-features";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import ImageLayer from "ol/layer/Image";
import ImageWMS from "ol/source/ImageWMS";
import { MapboxVectorLayer } from "ol-mapbox-style";

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
    const controls = map.olMap.getControls().getArray();
    const overViewMapControl = controls.find((control) => control instanceof OlOverviewMap);
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
    const controls = map.olMap.getControls().getArray();
    const overViewMapControl = controls.find((control) => control instanceof OlOverviewMap) as
        | OlOverviewMap
        | undefined;
    const wmtsLayer: TileLayer<WMTS> = overViewMapControl
        ?.getOverviewMap()
        ?.getLayers()
        .getArray()[0] as TileLayer<WMTS>;
    const source = wmtsLayer?.getSource();

    expect(wmtsLayer).toBeInstanceOf(TileLayer);
    expect(source).toBeInstanceOf(WMTS);
});

it("should support basemap type of OGC API Feature layer as a layer shown in the overview map", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getOGCAPIFeatureLayer();

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
    const controls = map.olMap.getControls().getArray();
    const overViewMapControl = controls.find((control) => control instanceof OlOverviewMap) as
        | OlOverviewMap
        | undefined;
    const ogcApiFeatureLayer: VectorLayer<VectorSource> = overViewMapControl
        ?.getOverviewMap()
        ?.getLayers()
        .getArray()[0] as VectorLayer<VectorSource>;
    const source = ogcApiFeatureLayer?.getSource();

    expect(ogcApiFeatureLayer).toBeInstanceOf(VectorLayer);
    expect(source).toBeInstanceOf(VectorSource);
});

it("should support basemap type of OGC API Feature layer with MapBox-Styles as a layer shown in the overview map", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getOGCAPIFeatureLayerWithMapboxStyle();

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
    const controls = map.olMap.getControls().getArray();
    const overViewMapControl = controls.find((control) => control instanceof OlOverviewMap) as
        | OlOverviewMap
        | undefined;
    const mapboxVectorLayer: MapboxVectorLayer = overViewMapControl
        ?.getOverviewMap()
        ?.getLayers()
        .getArray()[0] as MapboxVectorLayer;

    expect(mapboxVectorLayer).toBeInstanceOf(MapboxVectorLayer);
});

it("should support basemap type of OGC WMS layer as a layer shown in the overview map", async () => {
    const { mapId, registry } = await setupMap();
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });
    const layer = getOGCWMSLayer();

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
    const controls = map.olMap.getControls().getArray();
    const overViewMapControl = controls.find((control) => control instanceof OlOverviewMap) as
        | OlOverviewMap
        | undefined;
    const ogcWMSLayer: VectorLayer<VectorSource> = overViewMapControl
        ?.getOverviewMap()
        ?.getLayers()
        .getArray()[0] as VectorLayer<VectorSource>;
    const source = ogcWMSLayer?.getSource();

    expect(ogcWMSLayer).toBeInstanceOf(ImageLayer);
    expect(source).toBeInstanceOf(ImageWMS);
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

function getOGCAPIFeatureLayer() {
    return new VectorLayer({
        source: createVectorSource({
            baseUrl: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1",
            collectionId: "governmentalservice",
            crs: "http://www.opengis.net/def/crs/EPSG/0/3857",
            attributions:
                "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>"
        })
    });
}

function getOGCAPIFeatureLayerWithMapboxStyle() {
    return new MapboxVectorLayer({
        styleUrl: "https://demo.ldproxy.net/strassen/styles/default?f=mbs",
        accessToken: null
    });
}

function getOGCWMSLayer() {
    return new ImageLayer({
        source: new ImageWMS({
            url: "https://www.wms.nrw.de/wms/wms_nw_inspire-schulen",
            params: { "LAYERS": ["US.education"] },
            ratio: 1 //Ratio. 1 means image requests are the size of the map viewport
        })
    });
}
