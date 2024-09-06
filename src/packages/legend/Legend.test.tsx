// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it, vi } from "vitest";
import { createServiceOptions, setupMap } from "@open-pioneer/map-test-utils";
import TileLayer from "ol/layer/Tile";
import { act, render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Legend, LegendItemComponentProps } from "./Legend";
import { Box, Image, Text } from "@open-pioneer/chakra-integration";
import { SimpleLayer, WMSLayer } from "@open-pioneer/map";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const WMTS_CAPAS = readFileSync(resolve(THIS_DIR, "./test-data/SimpleWMSCapas.xml"), "utf-8");

// Happy dom does not have an XML parser
import jsdom from "jsdom";
window.DOMParser = new jsdom.JSDOM().window.DOMParser;

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

    const images = await getLegendImages(legendDiv, 2);
    expect(images.length).toBe(2);

    const src = images[1]?.getAttribute("src");
    expect(src).toBe("https://basemap-url.com/");
});

it("shows correct legend entries for nested WMSSublayers", async () => {
    const { mapId, registry } = await setupMap({
        layers: [createLayerWithNestedSublayers()],
        fetch: vi.fn(async () => {
            return new Response(WMTS_CAPAS, {
                status: 200
            });
        })
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
    const images = await getLegendImages(legendDiv, 4);

    // Ensure that no legend is created for sublayer without `name` prop and for sublayer with empty legend component
    expect(images[0]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer4_1.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer4_2.png");
    expect(images[2]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer3_2.png");
    // legend src is extract from the capabilities
    expect(images[3]?.getAttribute("src")).toBe("http://www.university.edu/legends/atlas.gif");
});

it("shows legend entries in correct order", async () => {
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
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-2.png"
                    }
                }
            },
            {
                title: "Layer 3",
                id: "layer-3",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        Component: function CustomLegend(props: LegendItemComponentProps) {
                            return (
                                <Box>
                                    <Text>{props.layer.title}</Text>
                                    <Box>
                                        <Image
                                            className="legend-item__image"
                                            src="https://fake.image.url/layer-3.png"
                                        ></Image>
                                    </Box>
                                </Box>
                            );
                        }
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
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 3);
    expect(images.length).toBe(3);
    expect(images[0]?.getAttribute("src")).toBe("https://fake.image.url/layer-3.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.image.url/layer-2.png");
    expect(images[2]?.getAttribute("src")).toBe("https://fake.image.url/layer-1.png");
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

it("reacts to changes in layer visibility", async () => {
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
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        Component: function CustomLegend(props: LegendItemComponentProps) {
                            return (
                                <Box>
                                    <Text>{props.layer.title}</Text>
                                    <Box>
                                        <Image
                                            className="legend-item__image"
                                            src="https://fake.image.url/layer-2.png"
                                        ></Image>
                                    </Box>
                                </Box>
                            );
                        }
                    }
                }
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    // First check
    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 2);
    expect(images.length).toBe(2);

    // Set visible to false
    const layers = map.layers.getOperationalLayers();
    act(() => {
        layers[0]?.setVisible(false);
    });

    // Second check
    const nextLegendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const nextImages = await getLegendImages(nextLegendDiv);
    expect(nextImages.length).toBe(1);
});

it("reacts to changes in layer legend attributes", async () => {
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
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    // First check
    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv);
    expect(images[0]?.getAttribute("src")).toBe("https://fake.image.url/layer-1.png");

    // Update attributes
    const layers = map.layers.getOperationalLayers();
    act(() => {
        layers[0]?.updateAttributes({
            legend: { imageUrl: "https://fake.image.url/new_layer.png" }
        });
    });

    // Second check
    const nextLegendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const nextImages = await getLegendImages(nextLegendDiv);
    expect(nextImages[0]?.getAttribute("src")).toBe("https://fake.image.url/new_layer.png");
});

it("reacts to changes in the layer composition", async () => {
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
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            }
        ]
    });
    const map = await registry.expectMapModel(mapId);
    const injectedServices = createServiceOptions({ registry });

    render(
        <PackageContextProvider services={injectedServices}>
            <Legend mapId={mapId} data-testid="legend" />
        </PackageContextProvider>
    );

    const layers = map.layers.getOperationalLayers();
    expect(layers.length).toBe(1);

    act(() => {
        map.layers.addLayer(
            new SimpleLayer({
                title: "Layer 2",
                id: "layer-2",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-2.png"
                    }
                }
            })
        );
    });

    const nextLayers = map.layers.getOperationalLayers();
    expect(nextLayers.length).toBe(2);

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 2);
    expect(images[0]?.getAttribute("src")).toBe("https://fake.image.url/layer-2.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.image.url/layer-1.png");
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

async function getLegendImages(legendDiv: HTMLElement, expectedCount = 1) {
    return await waitFor(() => {
        const legendImages = legendDiv.querySelectorAll(LEGEND_IMAGE_CLASS);
        if (legendImages.length < expectedCount) {
            throw new Error(
                `expected at least ${expectedCount} legend image(s), got only ${legendImages.length}`
            );
        }

        return Array.from(legendImages);
    });
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
                                                    return null;
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
