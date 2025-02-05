// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { nextTick } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import ImageLayer from "ol/layer/Image";
import { get as getProjection } from "ol/proj";
import ImageSource from "ol/source/Image";
import ImageWMS from "ol/source/ImageWMS";
import { Mock, afterEach, beforeEach, expect, it, vi } from "vitest";
import { WMSLayerConfig } from "../../api";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { MapModelImpl } from "../MapModelImpl";
import { WMSLayerImpl } from "./WMSLayerImpl";

const SERVICE_URL = "https://example.com/wms-service";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
});

it("provides the wms service url", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL
    });
    expect(layer.url).toBe(SERVICE_URL);
});

it("creates and configure a wms source", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-name",
                title: "Sublayer"
            }
        ]
    });

    const olLayer = layer.olLayer;
    expect(olLayer).toBeInstanceOf(ImageLayer);

    const olSource = (olLayer as ImageLayer<any>).getSource();
    expect(olSource).toBeInstanceOf(ImageWMS);
});

it("supports additional source options", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-name",
                title: "Sublayer"
            }
        ],
        sourceOptions: {
            attributions: "Test-Attributions",
            ratio: 0.5,
            params: {
                "FOO": "foo"
            }
        }
    });

    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const attributions = olSource.getAttributions()!(undefined as any);
    expect(attributions).toMatchInlineSnapshot(`
      [
        "Test-Attributions",
      ]
    `);

    const ratio = (olSource as any).ratio_ as number; // No getter
    expect(ratio).toBe(0.5);

    // LAYERS is managed by the class but other params are not overwritten
    const params = olSource.getParams();
    expect(params).toMatchInlineSnapshot(`
      {
        "FOO": "foo",
        "LAYERS": [
          "sublayer-name",
        ],
      }
    `);
});

it("configures the source's LAYERS parameter for sublayers", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            },
            {
                name: "sublayer-2",
                title: "Sublayer 2"
            }
        ]
    });
    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const layersParam = olSource.getParams()["LAYERS"];
    expect(layersParam).toEqual(["sublayer-1", "sublayer-2"]);
});

it("only configures the source's LAYERS parameter for sublayers with optional `name` prop ", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                title: "Parent sublayer",
                sublayers: [
                    {
                        title: "Subparent sublayer",
                        sublayers: [{ name: "sublayer-1", title: "Sublayer 1" }]
                    },
                    {
                        name: "sublayer-2",
                        title: "Sublayer 2"
                    }
                ]
            }
        ]
    });
    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const layersParam = olSource.getParams()["LAYERS"];
    expect(layersParam).toEqual(["sublayer-1", "sublayer-2"]);
});

it("only configures the source's LAYERS parameter for leaf sublayers", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "parent-sublayer",
                title: "Parent sublayer",
                sublayers: [
                    {
                        name: "sublayer-1",
                        title: "Sublayer 1"
                    },
                    {
                        name: "sublayer-2",
                        title: "Sublayer 2"
                    }
                ]
            }
        ]
    });

    // If parent-sublayer were also included in this array, their children would always
    // be shown, even if those children were set to invisible.
    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const layersParam = olSource.getParams()["LAYERS"];
    expect(layersParam).toEqual(["sublayer-1", "sublayer-2"]);
});

it("excludes invisible sublayers from the LAYERS parameter", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1",
                visible: false
            },
            {
                name: "sublayer-2",
                title: "Sublayer 2"
            }
        ]
    });
    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const layersParam = olSource.getParams()["LAYERS"];
    expect(layersParam).toEqual(["sublayer-2"]);
});

it("updates the layer's LAYERS param if a sublayer's visibility changes", async () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1",
                visible: false
            },
            {
                name: "sublayer-2",
                title: "Sublayer 2"
            }
        ],
        attach: true
    });

    const olSource = (layer.olLayer as ImageLayer<any>).getSource() as ImageWMS;
    const getLayersParam = () => olSource.getParams()["LAYERS"];
    expect(getLayersParam()).toEqual(["sublayer-2"]);

    layer.sublayers.getSublayers()[0]!.setVisible(true);
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(getLayersParam()).toEqual(["sublayer-1", "sublayer-2"]);

    layer.sublayers.getSublayers()[1]!.setVisible(false);
    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(getLayersParam()).toEqual(["sublayer-1"]);
});

it("provides access to sublayers", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ],
        attach: true
    });
    expect(layer.children).toBe(layer.sublayers);

    const sublayers = layer.sublayers.getSublayers();
    expect(sublayers.length).toBe(1);

    const sublayer = sublayers[0]!;
    expect(sublayer).toBeInstanceOf(AbstractLayerBase);
    expect(sublayer.name).toBe("sublayer-1");
    expect(sublayer.title).toBe("Sublayer 1");
    expect(sublayer.parentLayer).toBe(layer);
    expect(sublayer.parent).toBe(layer);
});

it("provides access to nested sublayers", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1",
                sublayers: [
                    {
                        name: "sublayer-2",
                        title: "Sublayer 2"
                    }
                ]
            }
        ],
        attach: true
    });

    const sublayer1 = layer.sublayers.getSublayers()[0]!;
    const sublayer2 = sublayer1.sublayers.getSublayers()[0]!;
    expect(sublayer2.name).toBe("sublayer-2");
    expect(sublayer2.title).toBe("Sublayer 2");
    expect(sublayer2.parentLayer).toBe(layer);
    expect(sublayer2.parent).toBe(sublayer1);
});

it("should return all wms sublayers", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1",
                id: "sublayer1",
                sublayers: [
                    {
                        name: "sublayer-2",
                        title: "Sublayer 2",
                        id: "sublayer2"
                    }
                ]
            }
        ],
        attach: true
    });

    const sublayers = layer.sublayers.getRecursiveLayers();
    const sublayerIds = sublayers.map((sublayer) => sublayer.id);
    expect(sublayerIds).toContain("sublayer1");
    expect(sublayerIds).toContain("sublayer2");
});

it("uses http service to fetch images", async () => {
    /*
        This test ensures that the image source used by WMSLayer uses
        the httpService provided by the map model to fetch images.

        It triggers a load() on the source used by the image layer (in a way usually done
        by the open layers map) and checks that the mocked httpService is actually being called for the URL.
    */
    let urls: string[] = [];
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL,
        sublayers: [
            {
                name: "sublayer-1",
                title: "Sublayer 1"
            }
        ],
        attach: true,
        fetch: vi.fn(async (url) => {
            urls.push(String(url));
            return new Response("", {
                status: 200
            });
        })
    });

    await vi.waitUntil(() => urls.length > 0); // Initial metadata
    urls = [];

    const source = (layer.olLayer as ImageLayer<ImageSource>).getSource()!;
    const projection = getProjection("EPSG:3857")!;
    const image = source.getImage([1, 2, 3, 4], 123, 42, projection);
    image.load();

    vi.advanceTimersByTime(1000);
    expect(urls).toHaveLength(1);
    expect(urls[0]!).toMatch(/^https:\/\/example\.com\/wms-service\?REQUEST=GetMap/);
});

it("does not have a source if no sublayers are visible", () => {
    const { layer } = createLayer({
        title: "Layer",
        url: SERVICE_URL
    });

    // ImageWMS with 'LAYERS' param set to [] produces network errors,
    // so this class just un-sets the source instead while no sublayers are visible.
    const source = (layer.olLayer as ImageLayer<any>).getSource();
    expect(source).toBeNull();
});

function createLayer(options: WMSLayerConfig & { fetch?: Mock; attach?: boolean }) {
    const layer = new WMSLayerImpl(options);
    const httpService = {
        fetch:
            options?.fetch ??
            vi.fn().mockImplementation(async () => new Response("", { status: 200 }))
    } as HttpService;
    const mapModel = {
        __sharedDependencies: {
            httpService: httpService as HttpService
        }
    } as MapModelImpl;

    if (options?.attach) {
        layer.__attachToMap(mapModel);
    }

    return {
        layer,
        mapModel,
        httpService
    };
}
