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

it("shows legend entries for nested sublayers", async () => {
    // todo setupMap anpassen
    const { mapId, registry } = await setupMapWithWMSLayer();
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
    expect(images.length).toBe(4);
    expect(images[0]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer4_1.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer4_2.png");
    expect(images[2]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer3_2.png");
    expect(images[3]?.getAttribute("src")).toBe(
        "https://fake.wms.url/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&SCALE=545978.7734655447&LAYERS=sublayer4_4%2Csublayer4_3%2Csublayer4_2%2Csublayer4_1&LAYER=sublayer4_3"
    );
});

it("shows legend entries in correct order", async () => {
    // TODO
});

it("shows legend entries only for visible layers", async () => {
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
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://not-visbile-layer.com/"
                    }
                },
                visible: false
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
    expect(src).not.toBe("https://not-visbile-layer.com/");
});

it("includes the layer id in the legend item's class list", async () => {
    const { mapId, registry } = await setupMap({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
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
    const firstLegendItem = await waitForLegendItem(legendDiv);
    expect(firstLegendItem.classList.contains("layer-layer-1")).toBe(true);
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
        url: "https://fake.wms.url/service",
        sublayers: [
            {
                title: "Sublayer 1",
                sublayers: [
                    {
                        title: "Sublayer 2",
                        sublayers: [
                            {
                                title: "Sublayer 3.2",
                                // legend for nested layer group
                                attributes: {
                                    "legend": {
                                        imageUrl: "https://fake.legend.url/sublayer3_2.png"
                                    }
                                },
                                sublayers: [
                                    {
                                        name: "sublayer4_4",
                                        title: "Sublayer 4.4",
                                        attributes: {
                                            "legend": {
                                                Component: function EmptyLegend() {
                                                    return "";
                                                }
                                            }
                                        }
                                    },
                                    {
                                        name: "sublayer4_3",
                                        title: "Sublayer 4.3"
                                    }
                                ]
                            },
                            {
                                title: "Sublayer 3.1",
                                sublayers: [
                                    {
                                        name: "sublayer4_2",
                                        title: "Sublayer 4.2",
                                        attributes: {
                                            "legend": {
                                                imageUrl: "https://fake.legend.url/sublayer4_2.png"
                                            }
                                        }
                                    },
                                    {
                                        name: "sublayer4_1",
                                        title: "Sublayer 4.1",
                                        attributes: {
                                            "legend": {
                                                imageUrl: "https://fake.legend.url/sublayer4_1.png"
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
