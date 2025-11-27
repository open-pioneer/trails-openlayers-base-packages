// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Image, Text } from "@chakra-ui/react";
import { GroupLayer, SimpleLayer, WMSLayer } from "@open-pioneer/map";
import {
    createTestLayer,
    createTestOlLayer,
    setupMap,
    SimpleMapOptions
} from "@open-pioneer/map-test-utils";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it, vi } from "vitest";
import { Legend, LegendItemAttributes, LegendItemComponentProps } from "./Legend";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const WMTS_CAPAS = readFileSync(resolve(THIS_DIR, "./test-data/SimpleWMSCapas.xml"), "utf-8");

// Happy dom does not have an XML parser
import jsdom from "jsdom";
import { ReactNode } from "react";
import TileLayer from "ol/layer/Tile";
window.DOMParser = new jsdom.JSDOM().window.DOMParser;

const LEGEND_ITEM_CLASS = ".legend-item";
const LEGEND_IMAGE_CLASS = ".legend-item__image";

it("should successfully create a legend component", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer()
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer()
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    expect(legendDiv).toMatchSnapshot();
});

it("should successfully show legend for imageUrl configuration", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer()
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

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

    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true
            },
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
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
                olLayer: createTestOlLayer()
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    expect(legendDiv).toMatchSnapshot();
});

it("does not show a legend for basemaps by default", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
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
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv);
    expect(images.length).toBe(1);

    const src = images[0]?.getAttribute("src");
    expect(src).not.toBe("https://basemap-url.com/");
});

it("shows a legend for active basemap if showBaseLayers is configured to be true", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Base layer",
                id: "base-layer",
                olLayer: createTestOlLayer(),
                isBaseLayer: true,
                attributes: {
                    "legend": {
                        imageUrl: "https://basemap-url.com/"
                    }
                }
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" showBaseLayers={true} />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 1);
    const src = images[0]?.getAttribute("src");
    expect(src).toBe("https://basemap-url.com/");
});

it("shows correct legend entries for nested WMSSublayers", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            createLayerWithNestedSublayers(false, {
                fetch: vi.fn(async () => {
                    return new Response(WMTS_CAPAS, {
                        status: 200
                    });
                })
            })
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

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

it("shows legend entries for group layers and their children", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            createTestLayer({
                type: GroupLayer,
                title: "Hintergrundkarten",
                visible: true,
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.legend.url/layer-group-1.png",
                        listMode: "show"
                    } satisfies LegendItemAttributes
                },
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        title: "Layer 1",
                        id: "layer-1",
                        olLayer: createTestOlLayer(),
                        attributes: {
                            "legend": {
                                imageUrl: "https://fake.legend.url/child-layer-1.png"
                            }
                        }
                    }),
                    createLayerWithNestedSublayers(false, {
                        fetch: vi.fn(async () => {
                            return new Response(WMTS_CAPAS, {
                                status: 200
                            });
                        })
                    })
                ]
            })
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    const images = await getLegendImages(legendDiv, 6);

    expect(images[0]?.getAttribute("src")).toBe("https://fake.legend.url/layer-group-1.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer4_1.png");
    expect(images[2]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer4_2.png");
    expect(images[3]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer3_2.png");
    expect(images[4]?.getAttribute("src")).toBe("http://www.university.edu/legends/atlas.gif");
    expect(images[5]?.getAttribute("src")).toBe("https://fake.legend.url/child-layer-1.png");
});

it("shows legend entries for group layers and their children if group layer has no legend", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            createTestLayer({
                type: GroupLayer,
                title: "Hintergrundkarten",
                visible: true,
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        title: "Layer 1",
                        id: "layer-1",
                        olLayer: createTestOlLayer(),
                        attributes: {
                            "legend": {
                                imageUrl: "https://fake.legend.url/child-layer-1.png"
                            }
                        }
                    })
                ]
            })
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    const images = await getLegendImages(legendDiv, 1);

    expect(images[0]?.getAttribute("src")).toBe("https://fake.legend.url/child-layer-1.png");
});

it("does not show child legends if 'hide-children' is used", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            createTestLayer({
                type: GroupLayer,
                title: "Hintergrundkarten",
                visible: true,
                attributes: {
                    legend: { listMode: "hide-children" } satisfies LegendItemAttributes
                },
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        title: "Layer 1",
                        id: "layer-1",
                        olLayer: createTestOlLayer(),
                        attributes: {
                            "legend": {
                                imageUrl: "https://fake.legend.url/child-layer-1.png"
                            }
                        }
                    })
                ]
            })
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await getLegendImages(legendDiv, 0);
});

it("only shows legend entry for group layer and not their children", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            createTestLayer({
                type: GroupLayer,
                title: "Hintergrundkarten",
                visible: true,
                attributes: {
                    "legend": { imageUrl: "https://fake.legend.url/layer-group-1.png" }
                },
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        title: "Layer 1",
                        id: "layer-1",
                        olLayer: createTestOlLayer(),
                        attributes: {
                            "legend": {
                                imageUrl: "https://fake.legend.url/child-layer-1.png"
                            }
                        }
                    }),
                    createLayerWithNestedSublayers(false, {
                        fetch: vi.fn(async () => {
                            return new Response(WMTS_CAPAS, {
                                status: 200
                            });
                        })
                    })
                ]
            })
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    const images = await getLegendImages(legendDiv, 1);

    expect(images[0]?.getAttribute("src")).toBe("https://fake.legend.url/layer-group-1.png");
});

it("shows legend entries for group layers and specific children", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            createTestLayer({
                type: GroupLayer,
                title: "Hintergrundkarten",
                visible: true,
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.legend.url/layer-group-1.png",
                        listMode: "show"
                    } satisfies LegendItemAttributes
                },
                layers: [
                    createTestLayer({
                        type: SimpleLayer,
                        title: "Layer 1",
                        id: "layer-1",
                        olLayer: createTestOlLayer(),
                        attributes: {
                            "legend": {
                                imageUrl: "https://fake.legend.url/child-layer-1.png"
                            }
                        }
                    }),
                    createLayerWithNestedSublayers(true, {
                        fetch: vi.fn(async () => {
                            return new Response(WMTS_CAPAS, {
                                status: 200
                            });
                        })
                    })
                ]
            })
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);
    const images = await getLegendImages(legendDiv, 4);

    expect(images[0]?.getAttribute("src")).toBe("https://fake.legend.url/layer-group-1.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.legend.url/sublayer3_2.png");
    expect(images[2]?.getAttribute("src")).toBe("http://www.university.edu/legends/atlas.gif");
    expect(images[3]?.getAttribute("src")).toBe("https://fake.legend.url/child-layer-1.png");
});

it("shows legend entries in correct order", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-2.png"
                    }
                }
            },
            {
                title: "Layer 3",
                id: "layer-3",
                olLayer: createTestOlLayer(),
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

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 3);
    expect(images.length).toBe(3);
    expect(images[0]?.getAttribute("src")).toBe("https://fake.image.url/layer-3.png");
    expect(images[1]?.getAttribute("src")).toBe("https://fake.image.url/layer-2.png");
    expect(images[2]?.getAttribute("src")).toBe("https://fake.image.url/layer-1.png");
});

it("shows legend entries only for visible layers", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://not-visbile-layer.com/"
                    }
                },
                visible: false
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv);
    expect(images.length).toBe(1);

    const src = images[0]?.getAttribute("src");
    expect(src).not.toBe("https://not-visbile-layer.com/");
});

it("includes the layer id in the legend item's class list", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                }
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    const firstLegendItem = await waitForLegendItem(legendDiv);
    expect(firstLegendItem.classList.contains("layer-layer-1")).toBe(true);
});

it("reacts to changes in layer visibility", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer(),
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

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

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
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

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
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                }
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const layers = map.layers.getOperationalLayers();
    expect(layers.length).toBe(1);

    act(() => {
        map.layers.addLayer(
            createTestLayer({
                type: SimpleLayer,
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer(),
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

it("shows legend entries only for layers that are not internal", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                },
                visible: true,
                internal: false
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://avatars.githubusercontent.com/u/121286957?s=200&v=4"
                    }
                },
                visible: true
                //internal === false by default
            },
            {
                title: "Layer 3",
                id: "layer-3",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://internal-layer.com/"
                    }
                },
                visible: true,
                internal: true
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 2);
    expect(images.length).toBe(2);

    let src = images[0]?.getAttribute("src");
    expect(src).not.toBe("https://internal-layer.com/");
    src = images[1]?.getAttribute("src");
    expect(src).not.toBe("https://internal-layer.com/");
});

it("reacts to changes in layer's internal state", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: createTestOlLayer(),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-1.png"
                    }
                },
                visible: true,
                internal: false
            },
            {
                title: "Layer 2",
                id: "layer-2",
                olLayer: createTestOlLayer(),
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
                },
                visible: true,
                internal: true
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    // First check
    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 1);
    expect(images.length).toBe(1);

    // Set internal to false
    const layer = map.layers.getLayerById("layer-2");
    act(() => {
        layer?.setInternal(false);
    });

    // Second check
    const nextLegendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const nextImages = await getLegendImages(nextLegendDiv, 2);
    expect(nextImages.length).toBe(2);
});

it("renders legend item if list mode is `show` even if layer is internal", async () => {
    const { map, Wrapper } = await setup({
        layers: [
            {
                title: "Layer 1",
                id: "layer-1",
                olLayer: new TileLayer({}),
                attributes: {
                    "legend": {
                        imageUrl: "https://fake.image.url/layer-1.png",
                        listMode: "show"
                    } satisfies LegendItemAttributes
                },
                visible: true,
                internal: false
            }
        ]
    });

    render(<Legend map={map} data-testid="legend" />, { wrapper: Wrapper });

    // First check
    const legendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const images = await getLegendImages(legendDiv, 1);
    expect(images.length).toBe(1);

    // Set internal to true
    const layers = map.layers.getOperationalLayers({ includeInternalLayers: false });
    act(() => {
        layers[0]?.setInternal(true);
    });

    // Second check, legend item should still be there because listMode has precedence over internal status
    const nextLegendDiv = await findLegend();
    await waitForLegendItem(legendDiv);

    const nextImages = await getLegendImages(nextLegendDiv, 1);
    expect(nextImages.length).toBe(1);
});

async function findLegend() {
    const legendDiv = await screen.findByTestId("legend");

    // Wait until the <ul> is rendered
    await waitFor(() => {
        const legendList = legendDiv.querySelector("> .legend-layer-list");
        if (!legendList) {
            throw new Error("legend list not mounted");
        }
        return legendList;
    });
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
        if (legendImages.length !== expectedCount) {
            throw new Error(
                `expected ${expectedCount} legend image(s), but got ${legendImages.length}`
            );
        }

        return Array.from(legendImages);
    });
}

function createLayerWithNestedSublayers(
    hideChildrenModification: boolean = false,
    options: { fetch: () => Promise<Response> }
): WMSLayer {
    return createTestLayer(
        {
            type: WMSLayer,
            title: "Nested Layer",
            visible: true,
            url: "https://fake.wms.url/service",
            attributes: {
                "legend": { listMode: "show" } satisfies LegendItemAttributes
            },
            sublayers: [
                {
                    title: "Sublayer 1",
                    attributes: {
                        "legend": {
                            listMode: "show"
                        } satisfies LegendItemAttributes
                    },
                    sublayers: [
                        {
                            title: "Sublayer 2",
                            attributes: {
                                "legend": {
                                    listMode: "show"
                                } satisfies LegendItemAttributes
                            },
                            sublayers: [
                                {
                                    title: "Sublayer 3.2",
                                    // legend for nested layer group
                                    attributes: {
                                        "legend": {
                                            imageUrl: "https://fake.legend.url/sublayer3_2.png",
                                            listMode: "show"
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
                                    attributes: {
                                        "legend": {
                                            listMode: hideChildrenModification
                                                ? "hide-children"
                                                : "show"
                                        } satisfies LegendItemAttributes
                                    },
                                    sublayers: [
                                        {
                                            name: "sublayer4_2",
                                            title: "Sublayer 4.2",
                                            attributes: {
                                                "legend": {
                                                    imageUrl:
                                                        "https://fake.legend.url/sublayer4_2.png",
                                                    listMode: "show"
                                                }
                                            }
                                        },
                                        {
                                            name: "sublayer4_1",
                                            title: "Sublayer 4.1",
                                            attributes: {
                                                "legend": {
                                                    imageUrl:
                                                        "https://fake.legend.url/sublayer4_1.png",
                                                    listMode: "show"
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
        },
        options
    );
}

async function setup(options: SimpleMapOptions & { returnMap?: true }) {
    const { map } = await setupMap(options);

    function Wrapper(props: { children?: ReactNode }) {
        return <PackageContextProvider {...props} />;
    }

    return { map, Wrapper };
}
