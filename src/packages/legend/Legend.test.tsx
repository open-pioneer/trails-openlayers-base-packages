// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { expect, it } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import TileLayer from "ol/layer/Tile";
import { render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Legend, LegendItemComponentProps } from "./Legend";
import { Box, Text } from "@open-pioneer/chakra-integration";
import { MapConfig, MapConfigProvider, SimpleLayer, WMSLayer } from "@open-pioneer/map";
import VectorLayer from "ol/layer/Vector";
import { createService } from "@open-pioneer/test-utils/services";
import { MapRegistryImpl } from "@open-pioneer/map/MapRegistryImpl";

const LEGEND_ITEM_CLASS = ".legend-item";
const LEGEND_IMAGE_CLASS = ".legend-item__image";

it("should successfully create a legend component", async () => {
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
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    expect(legendDiv).toMatchSnapshot();
});

it("should successfully show legend for imageUrl configuration", async () => {
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
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
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
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    // do snapshot test to test if layer title and image are shown correctly
    expect(legendDiv).toMatchSnapshot();
});

it("should successfully show legend for Component configuration", async () => {
    const dotStyle = {
        height: "25px",
        width: "25px",
        borderColor: "#4cb3ff",
        borderWidth: "3px",
        borderRadius: "50%",
        display: "inline-block "
    };

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
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        Component: function CustomLegend(props: LegendItemComponentProps) {
                            return (
                                <Box>
                                    <Text>{props.layer.title}</Text>
                                    <Box style={dotStyle}></Box>
                                </Box>
                            );
                        }
                    }
                }
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
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    expect(legendDiv).toMatchSnapshot();
});

it("does not show a legend for basemaps by default", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: new TileLayer({}),
                isBaseLayer: true,
                attributes: {
                    "legend": {
                        imageUrl: "https://basemap-url.com/"
                    }
                }
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
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
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    const images = await getLegendImages(legendDiv);
    expect(images.length).toBe(1);
    const src = images[0]?.getAttribute("src");
    expect(src).not.toBe("https://basemap-url.com/");
});

it("shows a legend for active basemap if showBaseLayers is configured to be true", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: new TileLayer({}),
                isBaseLayer: true,
                attributes: {
                    "legend": {
                        imageUrl: "https://basemap-url.com/"
                    }
                }
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
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
            <Legend mapId={mapId} data-testid="legend" showBaseLayers={true} />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    const images = await getLegendImages(legendDiv);
    expect(images.length).toBe(2);
    const src = images[1]?.getAttribute("src");
    expect(src).toBe("https://basemap-url.com/");
});

//TODO: Remove skip after sublayer logic is fixed
it.skip("shows legend entries for nested sublayers", async () => {
    // todo setupMap anpassen
    const { mapId, registry } = await setupMapWithWMSLayer();
    await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    console.log(await registry.getMapModel(mapId));

    render(
        <PackageContextProvider services={injectedServices}>
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    // todo replace snapshot test
    expect(legendDiv).toMatchSnapshot();
});

it("shows legend entries in correct order", async () => {
    // TODO
});

it("shows legend entries only for visible layers", async () => {
    // TODO
});

it("includes the layer id in the legend item's class list", async () => {
    // TODO
});

it("shows an empty box if not legend entries are available", async () => {
    // TODO
});

it("reacts to changes in layer visibility", async () => {
    // TODO
});

it("reacts to changes in layer legend attributes", async () => {
    // TODO
});

it("reacts to changes in the layer composition", async () => {
    // TODO
});

async function findLegend() {
    const legendDiv = await screen.findByTestId("legend");
    return legendDiv;
}

async function waitForLegendItem(legendDiv: HTMLElement) {
    return await waitFor(() => {
        const legendItem = legendDiv.querySelector(LEGEND_ITEM_CLASS);
        if (!legendItem) {
            throw new Error("legend item not mounted");
        }

        return legendItem;
    });
}

async function getLegendImages(legendDiv: HTMLElement) {
    return await waitFor(() => {
        const legendImages = legendDiv.querySelectorAll(LEGEND_IMAGE_CLASS);
        if (!legendImages) {
            throw new Error("legend images not mounted");
        }

        return legendImages;
    });
}

async function setupMapWithWMSLayer() {
    // Always use "test" as mapId for unit tests
    const mapId = "test";

    const mapConfig: MapConfig = {
        initialView: {
            kind: "position",
            center: { x: 847541, y: 6793584 },
            zoom: 10
        },
        projection: "EPSG:3857",
        layers: [
            new SimpleLayer({
                title: "OSM",
                olLayer: new VectorLayer()
            }),
            createLayerWithNestedSublayers()
        ]
    };

    const registry = await createService(MapRegistryImpl, {
        references: {
            providers: [new MapConfigProviderImpl(mapId, mapConfig)]
        }
    });

    return { mapId, registry };
}

class MapConfigProviderImpl implements MapConfigProvider {
    mapId = "default";
    mapConfig: MapConfig;

    constructor(mapId: string, mapConfig?: MapConfig | undefined) {
        this.mapId = mapId;
        this.mapConfig = mapConfig ?? {};
    }

    getMapConfig(): Promise<MapConfig> {
        return Promise.resolve(this.mapConfig);
    }
}

function createLayerWithNestedSublayers() {
    return new WMSLayer({
        title: "Nested Layer",
        visible: true,
        url: "https://www.wms.nrw.de/gd/bk05l",
        sublayers: [
            {
                name: "sublayer1",
                title: "sublayer1",
                sublayers: [
                    {
                        name: "sublayer2",
                        title: "sublayer2",
                        sublayers: [
                            {
                                name: "sublayer3_2",
                                title: "sublayer3_2",
                                sublayers: [
                                    {
                                        name: "sublayer4_3",
                                        title: "sublayer4_3"
                                    }
                                ]
                            },
                            {
                                name: "sublayer3_1",
                                title: "sublayer3_1",
                                sublayers: [
                                    {
                                        name: "sublayer4_2",
                                        title: "sublayer4_2",
                                        attributes: {
                                            "legend": {
                                                imageUrl:
                                                    "https://www.wms.nrw.de/gd/bk05l?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=Sickerwasserrate_Gruenland"
                                            }
                                        }
                                    },
                                    {
                                        name: "sublayer4_1",
                                        title: "sublayer4_1",
                                        attributes: {
                                            "legend": {
                                                imageUrl:
                                                    "https://www.wms.nrw.de/gd/bk05l?request=GetLegendGraphic%26version=1.3.0%26format=image/png%26layer=Direktabfluss_Gruenland"
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    });
}
